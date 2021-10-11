package redis

import (
	. "context"

	srOtel "sr/otel"

	"go.opentelemetry.io/otel"
	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.opentelemetry.io/otel/trace"

	"github.com/go-redis/redis/extra/rediscmd/v8"
	"github.com/go-redis/redis/v8"
)

var tracer = otel.Tracer("shadowroller.net/libsr/redis")

type traceHook struct{}

var _ redis.Hook = (*traceHook)(nil)

func SetupTracer() {
	tracer = otel.Tracer("shadowroller.net/libsr/redis")
}

func NewTraceHook() redis.Hook {
	return new(traceHook)
}

func (traceHook) BeforeProcess(ctx Context, cmd redis.Cmder) (Context, error) {
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

func (traceHook) AfterProcess(ctx Context, cmd redis.Cmder) error {
	span := trace.SpanFromContext(ctx)
	if err := cmd.Err(); err != nil && err != redis.Nil {
		srOtel.WithSetError(span, err)
	}
	span.End()
	return nil
}

func (traceHook) BeforeProcessPipeline(ctx Context, cmds []redis.Cmder) (Context, error) {
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

func (traceHook) AfterProcessPipeline(ctx Context, cmds []redis.Cmder) error {
	if len(cmds) == 0 {
		return nil
	}
	span := trace.SpanFromContext(ctx)
	if err := cmds[0].Err(); err != nil && err != redis.Nil {
		srOtel.WithSetError(span, err)
	}
	span.End()
	return nil
}
