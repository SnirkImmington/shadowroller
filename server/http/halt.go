package http

import (
	"context"
	"errors"
	"fmt"

	"sr/errs"
	"sr/log"
	srOtel "sr/otel"

	"go.opentelemetry.io/otel/trace"

	"github.com/go-redis/redis/v8"
)

func RawHalt(ctx context.Context, file string, line int, err error) {
	code := errs.HTTPCode(err)
	log.RawStdout(ctx, file, line, fmt.Sprintf(">> %v %v", code, err))
	span := trace.SpanFromContext(ctx)
	if span.IsRecording() {
		srOtel.WithSetError(span, err)
	}

	panic(err)
}

func HaltInternal(ctx context.Context, err error) {
	if err == nil {
		return
	}
	file, line := log.FileAndLine(1)
	if !errors.Is(err, errs.ErrInternal) {
		err = errs.Internal(err)
	}
	RawHalt(ctx, file, line, err)
}

func Halt(ctx context.Context, err error) {
	if err == nil {
		return
	}
	file, line := log.FileAndLine(1)
	RawHalt(ctx, file, line, err)
}

func HaltFor(ctx context.Context, cause error, base error) {
	if base == nil {
		return
	}
	file, line := log.FileAndLine(1)
	err := fmt.Errorf("%w: %v", cause, base)
	RawHalt(ctx, file, line, err)
}

var errRedisNotFound = errs.NotFoundf("redis: not found")

func MustRedis(ctx context.Context, redisErr error) {
	if redisErr == nil {
		return
	}
	if redisErr == redis.Nil {
		redisErr = errRedisNotFound
	} else {
		redisErr = errs.Internal(redisErr)
	}
	file, line := log.FileAndLine(1)
	RawHalt(ctx, file, line, redisErr)
}
