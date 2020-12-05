package routes

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"sr/config"
	"time"
)

type srContextKey int

const (
	requestIDKey        = srContextKey(0)
	requestConnectedKey = srContextKey(1)
	requestStartedKey   = srContextKey(2)
)

func withRequestID(ctx context.Context) context.Context {
	var id int
	if config.IsProduction {
		id = rand.Intn(4096)
	} else {
		id = rand.Intn(256)
	}
	return context.WithValue(ctx, requestIDKey, id)
}

func requestID(ctx context.Context) int {
	val := ctx.Value(requestIDKey)
	if val == nil {
		_ = log.Output(2, "Attempted to get request ID from missing context")
		return 0
	}
	return val.(int)
}

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
