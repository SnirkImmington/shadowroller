package redis

import (
	. "context"

	"go.opentelemetry.io/otel"
	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.opentelemetry.io/otel/trace"

	"github.com/go-redis/redis/extra/rediscmd/v8"
	"github.com/go-redis/redis/v8"
)

var tracer trace.Tracer

type TraceHook struct{}

var _ redis.Hook = (*TraceHook)(nil)

func SetupTracer() {
	tracer = otel.Tracer("shadowroller.net/libsr/redis")
}

func NewTraceHook() *TraceHook {
	return new(TraceHook)
}

func recordError(ctx Context, span trace.Span, err error) {
	if err != redis.Nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
	}
}

func (TraceHook) BeforeProcess(ctx Context, cmd redis.Cmder) (Context, error) {
	if !trace.SpanFromContext(ctx).IsRecording() {
		return ctx, nil
	}
	ctx, _ = tracer.Start(ctx, cmd.FullName(),
		trace.WithSpanKind(trace.SpanKindInternal),
		trace.WithAttributes(
			semconv.DBSystemRedis,
			semconv.DBStatementKey.String(rediscmd.CmdString(cmd)),
		),
	)
	// if config.RedisDebug { log.Print("redis: " + cmd.FullName()) }
	return ctx, nil
}

func (TraceHook) AfterProcess(ctx Context, cmd redis.Cmder) error {
	span := trace.SpanFromContext(ctx)
	if err := cmd.Err(); err != nil {
		recordError(ctx, span, err)
	}
	span.End()
	return nil
}

func (TraceHook) BeforeProcessPipeline(ctx Context, cmds []redis.Cmder) (Context, error) {
	if !trace.SpanFromContext(ctx).IsRecording() {
		return ctx, nil
	}
	summary, cmdsStr := rediscmd.CmdsString(cmds)
	ctx, _ = tracer.Start(ctx, "pipeline "+summary,
		trace.WithSpanKind(trace.SpanKindInternal),
		trace.WithAttributes(
			semconv.DBSystemRedis,
			attr.Int("db.redis.num_cmd", len(cmds)),
			semconv.DBStatementKey.String(cmdsStr),
		),
	)
	return ctx, nil
}

func (TraceHook) AfterProcessPipeline(ctx Context, cmds []redis.Cmder) error {
	if len(cmds) == 0 {
		return nil
	}
	span := trace.SpanFromContext(ctx)
	if err := cmds[0].Err(); err != nil {
		recordError(ctx, span, err)
	}
	span.End()
	return nil
}
