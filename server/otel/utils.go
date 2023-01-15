package otel

import (
	"context"
	"fmt"

	"sr/errs"

	"go.opentelemetry.io/otel/codes"
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.opentelemetry.io/otel/trace"
)

// WithSetError records an error for a span and also updates
// the span's status.
func WithSetError(span trace.Span, err error, opts ...trace.EventOption) error {
	if span.IsRecording() {
		span.RecordError(err, opts...)
		span.SetStatus(codes.Error, err.Error())
		if ty := errs.GetType(err); ty != "unspecified" {
			span.SetAttributes(semconv.ExceptionTypeKey.String(ty))
		}
	}
	return err
}

// WithSetErrorf records a formatted error for a span and also updates the
// span's status.
func WithSetErrorf(span trace.Span, message string, args ...interface{}) error {
	return WithSetError(span, fmt.Errorf(message, args...))
}

// RecordNonfatalError records an error for a span but does not update the
// span's status.
func RecordNonfatalError(ctx context.Context, err error) {
	span := trace.SpanFromContext(ctx)
	if span.IsRecording() {
		span.RecordError(err)
	}
}
