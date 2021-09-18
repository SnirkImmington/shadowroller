package taskCtx

import (
	"context"
	"fmt"
	"log"
	"math/rand"

	"sr/config"
)

type srContextKey int

const (
	taskIDKey = srContextKey(0)
)

func WithID(ctx context.Context) context.Context {
	var id int
	if config.IsProduction {
		id = rand.Intn(4096-1) + 1
	} else {
		id = rand.Intn(256-1) + 1
	}
	return context.WithValue(ctx, taskIDKey, id)
}

func GetID(ctx context.Context) int {
	val := ctx.Value(taskIDKey)
	if val == nil {
		return 0
	}
	return val.(int)
}

func GetName(ctx context.Context) string {
	val := ctx.Value(taskIDKey)
	if val == nil {
		return "???"
	}
	if config.IsProduction {
		return fmt.Sprintf("%03x", val.(int))
	}
	return fmt.Sprintf("%02x", val.(int))
}

func Log(ctx context.Context, format string, values ...interface{}) {
	RawLog(ctx, 1, format, values...)
}

func RawLog(ctx context.Context, stack int, format string, values ...interface{}) {
	id := GetID(ctx)
	var message string
	if len(values) == 0 {
		message = format
	} else {
		message = fmt.Sprintf(format, values...)
	}
	var logText string
	if config.IsProduction {
		logText = fmt.Sprintf("%03x %v", id, message)
	} else {
		logText = fmt.Sprintf("\033[38;5;%vm%02x\033[m %v\n", id, id, message)
	}
	err := log.Output(2+stack, logText) // Account for us and caller; stack=1 means caller's caller
	if err != nil {
		log.Print(id, " [Output Error] ", message)
	}
}
