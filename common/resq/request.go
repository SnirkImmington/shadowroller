package resq

import (
	"context"
	"encoding/json"
	"time"

	"shadowroller.net/common"
	"shadowroller.net/common/errs"

	"go.opentelemetry.io/otel/trace"
)

// Headers is metadata sent with each request.
type Headers struct {
	TraceInfo string    `redis:"trace"`
	From      string    `redis:"from"`
	Expires   time.Time `redis:"exp,omitempty"`
	After     time.Time `redis:"after,omitempty"`
}

// Request is a request message sent over the queue.
type Request struct {
	Headers
	Body string `redis:"body,omitempty"`
}

// Parse calls json.Unmarshal with r's Body
func (r *Request) Parse(val interface{}) error {
	return json.Unmarshal([]byte(r.Body), val)
}

// ParseTraceContext attempts to parse the request's TraceContext.
func (r *Request) ParseTraceContext() (trace.SpanContext, error) {
	if r.TraceInfo == "" {
		return nil, errs.NotFoundf("No trace context saved")
	}
	var spanContext trace.ContextConfig
	err := json.Unmarshal([]byte(r.TraceInfo), &spanContext)
	if err != nil {
		return nil, errs.Internal(err)
	}
	return trace.NewSpanContext(spanContext), nil
}

func newRequest(ctx context.Context, val *interface{}) (*Request, error) {
	body, err := json.Marshal(val)
	if err != nil {
		return nil, errs.BadRequest(err)
	}
	spanCtx := trace.SpanContextFromContext(ctx)
	headers := Headers{
		TraceInfo: spanCtx.String(),
		From:      common.ServiceName,
	}
}
