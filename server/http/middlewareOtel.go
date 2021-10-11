package http

import (
	"fmt"
	netHTTP "net/http"

	"sr/config"
	srOtel "sr/otel"

	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.opentelemetry.io/otel/trace"
)

func OtelMiddleware(wrapped netHTTP.Handler) netHTTP.Handler {
	return netHTTP.HandlerFunc(func(response Response, request Request) {
		name := fmt.Sprintf("%v %v", request.Method, request.URL)
		ctx := request.Context()
		// Get HTTP stuff
		var attrs []attr.KeyValue

		// Basic net stuff, net.* keys
		attrs = append(attrs, semconv.NetAttributesFromHTTPRequest("ip", request)...)
		// This actually sets all of the semconv netHTTP.* keys as far as I can tell
		// We set netHTTP.server_name to help differentiate prod and development
		attrs = append(attrs, semconv.HTTPServerMetricAttributesFromHTTPRequest(config.BackendOrigin.Host, request)...)
		// Set by semconv but we use a different header on CloudFlare, so this should override?
		attrs = append(attrs, semconv.HTTPClientIPKey.String(RequestRemoteIP(request)))
		// This is something we should be working with the HTTP lib to do.
		attrs = append(attrs, attr.String("http.route", request.URL.Path))

		for _, header := range config.LogExtraHeaders {
			found := request.Header.Get(header)
			attrs = append(attrs, attr.String("netHTTP.header."+header, found))
		}

		ctx, span := srOtel.Tracer.Start(ctx, name,
			trace.WithSpanKind(trace.SpanKindServer),
			trace.WithAttributes(attrs...),
		)
		defer span.End()

		request = request.WithContext(ctx)
		wrappedResponse := wrapResponse(response)

		defer func() {
			span.SetAttributes(
				semconv.HTTPResponseContentLengthKey.Int(wrappedResponse.written),
				semconv.HTTPStatusCodeKey.Int(wrappedResponse.status),
			)
			span.SetStatus(semconv.SpanStatusFromHTTPStatusCode(wrappedResponse.status))
		}()

		wrapped.ServeHTTP(wrappedResponse, request)
	})
}
