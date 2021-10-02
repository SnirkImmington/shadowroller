package routes

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"sr/config"
	srOtel "sr/otel"
	redisUtil "sr/redis"
	"sr/taskCtx"

	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.opentelemetry.io/otel/trace"

	"github.com/go-redis/redis/v8"
)

type Args struct {
	Ctx      context.Context
	Response Response
	Request  *Request
	Client   *redis.Client
	Span     trace.Span
}

func (a *Args) Get() (context.Context, Response, *Request, *redis.Client, trace.Span) {
	return a.Ctx, a.Response, a.Request, a.Client, a.Span
}

type Handler func(args *Args)

// HandlerFunc is used for the implementation of HTTP handlers in order to make
// testing mocks easier.
type HandlerFunc func(response Response, request *Request, client *redis.Client)

// Wrap converts a Shadowroller HTTP handler into a `net/httpHandlerFunc`.
func Wrap(handler HandlerFunc) http.HandlerFunc {
	return func(response Response, request *Request) {
		logRequest(request)
		handler(response, request, redisUtil.Client)
	}
}

func standardizeHeaderName(headerName string) string {
	return strings.ReplaceAll(strings.ToLower(headerName), "-", "_")
}

func logf2(ctx context.Context, format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	trace.SpanFromContext(ctx).AddEvent(
		"log", trace.WithAttributes(attr.String("log.message", msg)),
	)
	taskCtx.RawLog(ctx, 1, format, args...)
}

func logEvent(ctx context.Context, name string, attrs ...attr.KeyValue) {
	span := trace.SpanFromContext(ctx)
	attrs = append(attrs, attr.String("log.message", name))
	span.AddEvent("log", trace.WithAttributes(attrs...))
	result := strings.Builder{}
	result.WriteString(name)
	for _, attr := range attrs {
		if string(attr.Key) == "log.message" {
			continue
		}
		result.WriteString(" ")
		result.WriteString(string(attr.Key))
		result.WriteString("=")
		result.WriteString(attr.Value.Emit())
	}
	taskCtx.RawLog(ctx, 1, result.String())
}

// Wrap converts a Shadowroller HTTP Handler into a `net/http.HandlerFunc`.
func Wrap2(handler Handler) http.HandlerFunc {
	return func(response Response, request *Request) {
		logRequest(request)
		name := fmt.Sprintf("%v %v", request.Method, request.URL)
		ctx := request.Context()
		// Get HTTP stuff
		var attrs []attr.KeyValue

		// Basic net stuff, net.* keys
		attrs = append(attrs, semconv.NetAttributesFromHTTPRequest("ip", request)...)
		// This actually sets all of the semconv http.* keys as far as I can tell
		// We set http.server_name to help differentiate prod and development
		attrs = append(attrs, semconv.HTTPServerMetricAttributesFromHTTPRequest(config.BackendOrigin.Host, request)...)
		// Set by semconv but we use a different header on CloudFlare, so this should override?
		attrs = append(attrs, semconv.HTTPClientIPKey.String(requestRemoteIP(request)))

		for _, header := range config.LogExtraHeaders {
			found := request.Header.Get(header)
			attrs = append(attrs, attr.String("http.header."+header, found))
		}

		ctx, span := srOtel.Tracer.Start(ctx, name,
			trace.WithSpanKind(trace.SpanKindServer),
			trace.WithAttributes(attrs...),
		)
		defer span.End()

		request = request.WithContext(ctx)
		wrapped := wrapResponse(response)
		args := &Args{ctx, wrapped, request, redisUtil.Client, span}
		handler(args)
		defer func() {
			span.SetAttributes(
				semconv.HTTPResponseContentLengthKey.Int(wrapped.written),
				semconv.HTTPStatusCodeKey.Int(wrapped.status),
			)
			span.SetStatus(semconv.SpanStatusFromHTTPStatusCode(wrapped.status))
			if err := recover(); err != nil {
				if err, ok := err.(error); ok && err != nil {
					span.RecordError(err, trace.WithStackTrace(true))
				}
				// status is always set
				panic(err)
				// TODO reorganize how exception handling is done
			}
		}()
	}
}
