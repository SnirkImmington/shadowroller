package resq

import (
	"context"
	"errors"
	"fmt"
	"time"

	"shadowroller.net/libsr/errs"
	redisUtil "shadowroller.net/libsr/redis"
	"shadowroller.net/libsr/shutdown"

	"github.com/go-redis/redis/v8"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

type Handler func(args *Args)

type Args struct {
	Ctx     context.Context
	Request *Request
	Client  *redis.Client
}

func (args *Args) Get() (context.Context, *Request, *redis.Client) {
	return args.Ctx, args.Request, args.Client
}

func runHandler(ctx context.Context, handler Handler, path string, id string, rawRequest map[string]string) {
	var request Request
	//err := redisUtil.Parse(rawRequest, &request)
	// if err !+ nil {
	// // We need a way to forward this parse error here.
	// }

	// Get the span info from the request
	var link *trace.Link
	spanContext, err := request.ParseSpanCtx()
	if err == nil {
		link = &trace.Link{spanContext}
	} else if !errors.Is(err, errs.ErrNotFound) {
		// This is the parse error
	}
	// Start a child span for the process
	opts := []trace.SpanStartOptions{
		trace.withSpanKind(trace.SpanKindConsumer),
	}
	if link != nil {
		opts = append(opts, trace.WithLinks(link))
	}
	span, ctx := srOtel.Tracer.Start(ctx, "handler", opts)
	defer span.End()

	if !request.Expires.IsZero() {
		span.RecordEvent("Apply timeout")
		ctx, _ = context.WithDeadline(ctx, request.Expires)
		// Maybe do an initial check of the timeout here
	}
	if !request.After.IsZero() {
		span.RecordEvent("Apply after")
		_, subSpan := srOtel.Tracer.Start(ctx, "sleep till request After")
		time.Sleep(time.Until(request.After))
		subSpan.End()
	}

	name := fmt.Sprintf("handle %v %v", path, id) // Not sure what to put here
	// We don't hold up the shutdown context in the handler, the handler can check
	// the shutdown status itself if it wants to.
	_, release := shutdown.Register(ctx, name)
	defer release()

	defer func() {
		var data interface{}
		var err error
		if data = recover(); data == nil {
			return
		}
		var span trace.Span // TODO how do we get these from defer again? closure?
		if passedErr, ok := data.(error); ok {
			err = passedErr
		} else {
			err = fmt.Errorf("%w: unexpected panic data %v", errs.ErrLogic, data)
		}
		if !errors.Is(err, errs.ErrHalt) {
			span.RecordError(err)
			span.Stacktrace(true)
			span.SetStatus(codes.Error, "unexpected panic")
		}
		// If the error is a redis error, we may not be able to reply and stuff
	}()

	handler(&Args{ctx, request, redisUtil.Client})
}
