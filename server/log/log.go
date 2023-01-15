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
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.opentelemetry.io/otel/trace"
)

// fileNameLen is the amount of characters of the source filename to write to stdout
const fileNameLen = 14
// timeFormat is the format for timestamps in the stdout logs
const timeFormat = "15:04:05 "

/*
func Location(depth int) (file string, line int, fn string) {
	// This is the code that runtime.Caller calls before discarding frame.Function.
	buf := make([]uintptr, 1)
	runtime.Callers(depth + 1, buf)
	frame, _ := runtime.CallersFrames(buf).Next()
	if frame.PC == 0 {
		return "??????.go", 0, "unknown"
	}
	return frame.File, frame.Line, fn

}*/

func FileAndLine(depth int) (string, int) {
	// This is the code that runtime.Caller calls before discarding frame.Function.
	buf := make([]uintptr, 1)
	runtime.Callers(depth + 1, buf)
	frame, _ := runtime.CallersFrames(buf).Next()
	if frame.PC == 0 {
		return "??????.go", 0
	}
	return frame.File, frame.Line
}

func Frame(depth int) runtime.Frame {
	buf := make([]uintptr, 1)
	runtime.Callers(depth + 1, buf)
	frame, _ := runtime.CallersFrames(buf).Next()
	return frame
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
			builder.WriteString(key[strings.LastIndex(key, ".")+1:])
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
	info = append(info, semconv.CodeFilepathKey.String(file), semconv.CodeLineNumberKey.Int(line))
	if span.IsRecording() {
		info = append(info, attr.String("log.message", name))
		span.AddEvent("log", trace.WithAttributes(info...))
	}
}

func RawRecord(ctx context.Context, file string, line int, name string, info ...attr.KeyValue) {
	now := time.Now()
	span := trace.SpanFromContext(ctx)
	builder := strings.Builder{}
	writeTime(&builder, now)
	writeLocation(&builder, file, line)
	writeSpanID(&builder, ctx)
	builder.WriteString(name)
	writeAttrs(&builder, info)
	fmt.Println(builder.String())
	info = append(info, semconv.CodeFilepathKey.String(file), semconv.CodeLineNumberKey.Int(line))
	if span.IsRecording() {
		span.AddEvent(name, trace.WithAttributes(info...))
	}
}

func CallerEvent(ctx context.Context, name string, info ...attr.KeyValue) {
	file, line := FileAndLine(2)
	RawEvent(ctx, file, line, name, info...)
}

func Event(ctx context.Context, name string, info ...attr.KeyValue) {
	file, line := FileAndLine(2)
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
		span.AddEvent(message, trace.WithAttributes(
			semconv.CodeFilepathKey.String(file),
			semconv.CodeLineNumberKey.Int(line),
		))
	}
}

func CallerPrint(ctx context.Context, message string) {
	file, line := FileAndLine(2)
	RawPrint(ctx, file, line, message)
}

func Print(ctx context.Context, message string) {
	file, line := FileAndLine(2)
	RawPrint(ctx, file, line, message)
}

func Printf(ctx context.Context, message string, args ...interface{}) {
	file, line := FileAndLine(2)
	RawPrint(ctx, file, line, fmt.Sprintf(message, args...))
}

func Record(ctx context.Context, message string, attrs ...attr.KeyValue) {
	file, line := FileAndLine(2)
	RawRecord(ctx, file, line, message, attrs...)
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
	file, line := FileAndLine(3)
	RawStdout(ctx, file, line, message)
}

func Stdout(ctx context.Context, message string) {
	file, line := FileAndLine(2)
	RawStdout(ctx, file, line, message)
}

func Stdoutf(ctx context.Context, message string, args ...interface{}) {
	file, line := FileAndLine(2)
	RawStdout(ctx, file, line, fmt.Sprintf(message, args...))
}
