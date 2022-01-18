package otel

import (
	"context"
	"fmt"
	"io"
	stdLog "log"
	"strings"

	"shadowroller.net/libsr/log"

	"go.opentelemetry.io/otel/trace"
)

var _ io.Writer = (*spanWriter)(nil)

type spanWriter struct {
	ctx context.Context
}

var errorFilter = []string{
	// "hijacked connection", // Write or WriteHeader on one
	// "invalid Content-Length", // Specified < 0 content length
	// "both Transfer-Encoding", // Not sure we set that but we shouldn't
	// "panic serving", // We handle panics in middleware, this shouldn't happen
	"handshake error", // Malicious clients not using HTTPS
	// "contains semicolon", // Not sure if this is a vulnerability, leave on for now
	// "Accept error", // Seems like malicious client but will leave on for now
}

// MakeLogger constructs a `log.Logger` which writes to the given context's trace
func MakeLogger(ctx context.Context) *stdLog.Logger {
	writer := &spanWriter{ctx}
	return stdLog.New(writer, "", 0)
}

func (w *spanWriter) Write(buf []byte) (int, error) {
	evt := string(buf[0 : len(buf)-2]) // Remove trailing \n
	log.Print(w.ctx, evt)
	shouldError := true
	for _, filter := range errorFilter {
		if strings.Contains(evt, filter) {
			shouldError = false
			break
		}
	}
	if shouldError {
		trace.SpanFromContext(w.ctx).RecordError(fmt.Errorf("%v", evt))
	}
	return len(buf), nil
}
