package otel

import (
	"fmt"

	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

// SetError records an error for a span and also updates its status.
func WithSetError(span trace.Span, err error, opts ...trace.EventOption) error {
	span.RecordError(err, opts...)
	span.SetStatus(codes.Error, err.Error())
	return err
}

func WithSetErrorf(span trace.Span, message string, args ...interface{}) error {
	err := fmt.Errorf(message, args...)
	span.RecordError(err)
	span.SetStatus(codes.Error, err.Error())
	return err
}
