package log

import (
	"context"
	"fmt"
	"runtime"
	"runtime/debug"
	"strings"
	"time"

	"sr/config"
	"sr/taskCtx"

	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

const fileNameLen = 14
const timeFormat = "15:04:05 "

func FileAndLine(depth int) (string, int) {
	_, file, line, ok := runtime.Caller(depth + 1)
	if !ok {
		return "??????.go", 0
	}
	return file, line
}

func writeStacktrace(builder *strings.Builder) {
	stack := debug.Stack()
	builder.Write(stack)
}

func writeTime(builder *strings.Builder, ts time.Time) {
	builder.WriteString(ts.Format(timeFormat))
}

func writeLocation(builder *strings.Builder, file string, line int) {
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

func writeSpanID(builder *strings.Builder, ctx context.Context) {
	id := taskCtx.GetID(ctx)
	if config.IsProduction {
		builder.WriteString(fmt.Sprintf("%03x ", id))
	} else {
		builder.WriteString(fmt.Sprintf("\033[38;5;%vm%02x\033[m ", id, id))
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

func RawEvent(ctx context.Context, file string, line int, name string, info ...attr.KeyValue) {
	now := time.Now()
	span := trace.SpanFromContext(ctx)
	builder := strings.Builder{}
	writeTime(&builder, now)
	writeLocation(&builder, file, line)
	writeSpanID(&builder, ctx)
	builder.WriteString(name)
	writeAttrs(&builder, info)
	fmt.Println(builder.String())
	if span.IsRecording() {
		info = append(info, attr.String("log.message", name))
		span.AddEvent("log", trace.WithAttributes(info...))
	}
}

func CallerEvent(ctx context.Context, name string, info ...attr.KeyValue) {
	file, line := FileAndLine(2)
	RawEvent(ctx, file, line, name, info...)
}

func Event(ctx context.Context, name string, info ...attr.KeyValue) {
	file, line := FileAndLine(1)
	RawEvent(ctx, file, line, name, info...)
}

func RawPrint(ctx context.Context, file string, line int, message string) {
	now := time.Now()
	builder := strings.Builder{}
	span := trace.SpanFromContext(ctx)
	writeTime(&builder, now)
	writeLocation(&builder, file, line)
	writeSpanID(&builder, ctx)
	builder.WriteString(message)
	fmt.Println(builder.String())
	if span.IsRecording() {
		span.AddEvent(message)
	}
}

func CallerPrint(ctx context.Context, message string) {
	file, line := FileAndLine(2)
	RawPrint(ctx, file, line, message)
}

func Print(ctx context.Context, message string) {
	file, line := FileAndLine(1)
	RawPrint(ctx, file, line, message)
}

func Printf(ctx context.Context, message string, args ...interface{}) {
	file, line := FileAndLine(1)
	RawPrint(ctx, file, line, fmt.Sprintf(message, args...))
}

func RawStdout(ctx context.Context, file string, line int, message string) {
	now := time.Now()
	builder := strings.Builder{}
	writeTime(&builder, now)
	writeLocation(&builder, file, line)
	writeSpanID(&builder, ctx)
	builder.WriteString(message)
	fmt.Println(builder.String())
}

func CallerStdout(ctx context.Context, message string) {
	file, line := FileAndLine(2)
	RawStdout(ctx, file, line, message)
}

func Stdout(ctx context.Context, message string) {
	file, line := FileAndLine(1)
	RawStdout(ctx, file, line, message)
}

func Stdoutf(ctx context.Context, message string, args ...interface{}) {
	file, line := FileAndLine(1)
	RawStdout(ctx, file, line, fmt.Sprintf(message, args...))
}
