package log

import (
	"context"
	"fmt"
	"runtime"
	"runtime/debug"
	"strings"
	"time"

	"sr/config"

	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

const fileNameLen = 14

func writeStacktrace(builder *strings.Builder) {
	stack := debug.Stack()
	builder.Write(stack)
}

func writePrefix(builder *strings.Builder, depth int) {
	now := time.Now()
	_, file, line, ok := runtime.Caller(depth + 2)
	if !ok {
		file = "???????.go"
		line = 0
	}
	builder.WriteString(now.Format("15:04:05 "))

	seenSlash := false
	slashIndex := len(file) - 1
	for ; slashIndex > 0; slashIndex-- {
		found := file[slashIndex]
		if found == '/' {
			if seenSlash {
				break
			}
			seenSlash = true
		}
	}
	file = file[slashIndex+1:]

	// Write file name
	// Try slicing off .go first
	if len(file) > fileNameLen {
		file = file[:len(file)-3]
	}
	if len(file) > fileNameLen {
		// Cut off the name
		builder.WriteString(file[:fileNameLen])
	} else if len(file) < fileNameLen {
		// Pad with spaces
		missing := fileNameLen - len(file)
		builder.WriteString(strings.Repeat(" ", missing))
		builder.WriteString(file)
	} else {
		// Same length
		builder.WriteString(file)
	}
	builder.WriteString(fmt.Sprintf(":%03d ", line))
}

func writeSpanID(builder *strings.Builder, spanID trace.SpanID) {
	var hash int64
	for _, b := range spanID {
		hash += int64(b)
	}
	if config.IsProduction {
		hash = hash % 4096
		builder.WriteString(fmt.Sprintf("%03x ", hash))
	} else {
		hash = hash % 256
		builder.WriteString(fmt.Sprintf("\033[38;5;%vm%02x\033[m ", hash, hash))
	}
}

func writeAttrs(builder *strings.Builder, attrs []attr.KeyValue) {
	for _, attr := range attrs {
		builder.WriteRune(' ')
		key := string(attr.Key)
		if strings.HasPrefix(key, "sr.") {
			builder.WriteString(key[strings.LastIndex(key, "."):])
		} else {
			builder.WriteString(key)
		}
		builder.WriteRune('=')
		builder.WriteString(attr.Value.Emit())
	}
}

func RawEvent(depth int, ctx context.Context, name string, info ...attr.KeyValue) {
	span := trace.SpanFromContext(ctx)
	builder := strings.Builder{}
	writePrefix(&builder, depth)
	writeSpanID(&builder, span.SpanContext().SpanID())
	builder.WriteString(name)
	writeAttrs(&builder, info)
	fmt.Println(builder.String())
	if span.IsRecording() {
		info = append(info, attr.String("log.message", name))
		span.AddEvent("log", trace.WithAttributes(info...))
	}
}

func Event(ctx context.Context, name string, info ...attr.KeyValue) {
	RawEvent(1, ctx, name, info...)
}

func RawPrintf(depth int, ctx context.Context, message string, args ...interface{}) {
	builder := strings.Builder{}
	writePrefix(&builder, depth)
	msg := fmt.Sprintf(message, args...)
	span := trace.SpanFromContext(ctx)
	writeSpanID(&builder, span.SpanContext().SpanID())
	builder.WriteString(msg)
	fmt.Println(builder.String())
	if span.IsRecording() {
		span.AddEvent(msg)
	}
}

func Print(ctx context.Context, message string) {
	RawPrintf(1, ctx, message)
}

func Printf(ctx context.Context, message string, args ...interface{}) {
	RawPrintf(1, ctx, message, args...)
}

func RawStdout(depth int, ctx context.Context, message string) {
	builder := strings.Builder{}
	writePrefix(&builder, depth)
	span := trace.SpanFromContext(ctx)
	writeSpanID(&builder, span.SpanContext().SpanID())
	builder.WriteString(message)
	fmt.Println(builder.String())
}

func Stdout(ctx context.Context, message string) {
	RawStdout(1, ctx, message)
}

func Stdoutf(ctx context.Context, message string, args ...interface{}) {
	Stdout(ctx, fmt.Sprintf(message, args...))
}
