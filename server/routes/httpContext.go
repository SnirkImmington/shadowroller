package routes

import (
	"context"
	"fmt"
	"log"
	"time"
)

type requestContextKey int

const (
	requestConnectedKey = requestContextKey(1)
	requestRedisConnKey = requestContextKey(3)
)

func withConnectedNow(ctx context.Context) context.Context {
	now := time.Now()
	return context.WithValue(ctx, requestConnectedKey, now)
}

func connectedAt(ctx context.Context) time.Time {
	val := ctx.Value(requestConnectedKey)
	if val == nil {
		_ = log.Output(2, fmt.Sprintf("Unable to get request connected at: %v", ctx))
		return time.Now()
	}
	return val.(time.Time)
}

func displayRequestDuration(ctx context.Context) string {
	val := ctx.Value(requestConnectedKey)
	if val == nil {
		_ = log.Output(2, fmt.Sprintf("Unable to get request duration: %v", ctx))
		return "??"
	}
	const displayResolution = time.Duration(1) * time.Millisecond / 10
	dur := time.Now().Sub(val.(time.Time))
	return dur.Truncate(displayResolution).String()
}
