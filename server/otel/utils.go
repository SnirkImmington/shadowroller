package otel

import (
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

// SetError records an error for a span and also updates its status.
func SetError(span trace.Span, err error, opts ...trace.EventOption) {
	span.RecordError(err, opts...)
	span.SetStatus(codes.Error, err.Error())
}
