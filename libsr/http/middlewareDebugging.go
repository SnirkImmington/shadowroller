package http

import (
	netHTTP "net/http"
	"time"

	"shadowroller.net/libsr/log"
	srOtel "shadowroller.net/libsr/otel"

	"go.opentelemetry.io/otel/trace"
)

// slowResponsesMiddleware causes all requests to wait 3 seconds before replying.
func SlowResponsesMiddleware(wrapped netHTTP.Handler) netHTTP.Handler {
	return netHTTP.HandlerFunc(func(response Response, request Request) {
		log.Printf(request.Context(), "Waiting 3 seconds to respond...")
		_, sleepSpan := srOtel.Tracer.Start(request.Context(), "SlowResponses sleep",
			trace.WithSpanKind(trace.SpanKindInternal),
		)
		time.Sleep(3 * time.Second)
		sleepSpan.End()
		wrapped.ServeHTTP(response, request)
	})
}
