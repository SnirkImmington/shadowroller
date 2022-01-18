// Package taskCtx defines values which Shadowroller stores in contexts.
//
// These are typically used to inject "global" values into request contexts.
// We do not use contexts to store optional values.
package taskCtx

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"sr/config"

	"go.opentelemetry.io/otel/trace"

	"github.com/go-redis/redis/v8"
)

type contextKey int

var (
	taskIDKey      contextKey = 0
	taskStartKey   contextKey = 1
	redisClientKey contextKey = 2
)

// WithID attaches a task ID to a context which is not already part of a trace.
func WithID(ctx context.Context) context.Context {
	if GetID(ctx) != 0 {
		return ctx
	}
	var id int64
	if config.IsProduction {
		id = rand.Int63n(4096-1) + 1
	} else {
		id = rand.Int63n(256-1) + 1
	}
	return context.WithValue(ctx, taskIDKey, id)
}

// GetID returns either a shortened form of the trace ID, or the previously
// assigned ID from WithID(), or 0 if neither is present.
func GetID(ctx context.Context) int64 {
	span := trace.SpanFromContext(ctx)
	spanContext := span.SpanContext()
	if spanContext.HasTraceID() {
		id := spanContext.TraceID()
		var hash int64
		for _, b := range id {
			hash += int64(b)
		}
		if config.IsProduction {
			hash = hash % 1024
		} else {
			hash = hash % 256
		}
		return hash
	}
	val := ctx.Value(taskIDKey)
	if val == nil {
		return 0
	}
	return val.(int64)
}

// FormatID formats a context's ID (from its trace or WithTaskID) with zero-padding.
func FormatID(id int64) string {
	if id == 0 {
		return "??"
	}
	if config.IsProduction {
		return fmt.Sprintf("%03x", id)
	}
	return fmt.Sprintf("%02x", id)
}

// GetName returns a formatted version of GetID, useful for printing.
func GetName(ctx context.Context) string {
	return FormatID(GetID(ctx))
}

// WithStart returns a context such that GetStart() will return startTime.
func WithStart(ctx context.Context, startTime time.Time) context.Context {
	return context.WithValue(ctx, taskStartKey, startTime)
}

// WithStartNow calls WithStart() with time.Now()
func WithStartNow(ctx context.Context) context.Context {
	return WithStart(ctx, time.Now())
}

// GetStart gets the recorded starting time for the context, if any.
func GetStart(ctx context.Context) (time.Time, bool) {
	val := ctx.Value(taskStartKey)
	if val == nil {
		var found time.Time
		return found, false
	}
	return val.(time.Time), true
}

func FormatDuration(ctx context.Context) string {
	val := ctx.Value(taskStartKey)
	if val == nil {
		//_ = log.RawPrintf(2, ctx, "Unable to get request duration for %v", ctx)
		return "??"
	}
	const displayResolution = time.Duration(1) * time.Millisecond / 10
	dur := time.Now().Sub(val.(time.Time))
	return dur.Truncate(displayResolution).String()

}

func WithRedisClient(ctx context.Context, client *redis.Client) context.Context {
	return context.WithValue(ctx, redisClientKey, client)
}

func GetRedisClient(ctx context.Context) *redis.Client {
	val := ctx.Value(redisClientKey)
	if val == nil {
		return nil
	}
	return val.(*redis.Client)
}
