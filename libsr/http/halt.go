package http

import (
	"context"
	"errors"
	"fmt"

	"shadowroller.net/libsr/errs"
	"shadowroller.net/libsr/log"
	srOtel "shadowroller.net/libsr/otel"

	"go.opentelemetry.io/otel/trace"

	"github.com/go-redis/redis/v8"
)

func RawHalt(ctx context.Context, file string, line int, err error) {
	code := errs.HTTPCode(err)
	log.RawStdout(ctx, file, line, fmt.Sprintf(">> %v %v", code, err))
	span := trace.SpanFromContext(ctx)
	if span.IsRecording() && errs.GetType(err) == "internal" {
		log.Printf(ctx, "Gonna record %v %v", errs.GetType((err)), err)
		srOtel.WithSetError(span, err)
	} else {
		log.Printf(ctx, "Not gonna record %v", err)
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
