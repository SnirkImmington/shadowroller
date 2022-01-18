package otel

import (
	"fmt"
	"shadowroller.net/libsr/errs"

	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.opentelemetry.io/otel/trace"
)

// SetError records an error for a span and also updates its status.
func WithSetError(span trace.Span, err error, opts ...trace.EventOption) error {
	span.RecordError(err, opts...)
	span.SetStatus(codes.Error, err.Error())
	if ty := errs.GetType(err); ty != "unspecified" {
		span.SetAttributes(semconv.ExceptionTypeKey.String(ty))
	}
	return err
}

func WithSetErrorf(span trace.Span, message string, args ...interface{}) error {
	return WithSetError(span, fmt.Errorf(message, args...))
}
