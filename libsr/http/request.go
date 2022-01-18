package http

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"shadowroller.net/libsr/config"
	"shadowroller.net/libsr/errs"
	"shadowroller.net/libsr/log"
	"shadowroller.net/libsr/taskCtx"
)

func RequestRemoteAddr(request Request) string {
	if config.ClientIPHeader != "" {
		res := request.Header.Get(config.ClientIPHeader)
		if res != "" {
			return res
		}
	}
	return request.RemoteAddr
}

func RequestRemoteIP(request Request) string {
	addr := RequestRemoteAddr(request)
	portIx := strings.LastIndex(addr, ":")
	if portIx == -1 {
		return addr
	}
	return addr[:portIx]
}

func LogRequest(request Request, path string) {
	file, line := log.FileAndLine(1)
	logRequest(request, path, file, line)
}

var errExtraBody = errors.New("encountered additional data after end of JSON body")

func MustReadBodyJSON(request Request, value interface{}) {
	err := ReadBodyJSON(request, value)
	if err == nil {
		return
	}
	file, line := log.FileAndLine(1)
	RawHalt(request.Context(), file, line, errs.BadRequest(err))
}

func ReadBodyJSON(request Request, value interface{}) error {
	decoder := json.NewDecoder(request.Body)
	decoder.DisallowUnknownFields()
	err := decoder.Decode(value)
	if err != nil {
		return err
	}
	if decoder.More() {
		return errExtraBody
	}
	return nil
}

func WriteBodyJSON(response Response, value interface{}) error {
	response.Header().Set("Content-Type", "text/json")
	return json.NewEncoder(response).Encode(value)
}

func MustWriteBodyJSON(ctx context.Context, response Response, value interface{}) {
	err := WriteBodyJSON(response, value)
	if err == nil {
		return
	}
	file, line := log.FileAndLine(1)
	RawHalt(ctx, file, line, errs.Internal(err))
}

func LogSuccess(ctx context.Context, message string) {
	if len(message) == 0 {
		message = "OK"
	}
	dur := taskCtx.FormatDuration(ctx)
	log.CallerStdout(ctx, fmt.Sprintf(">> 200 %v (%v)", message, dur))
}

func LogSuccessf(ctx context.Context, format string, args ...interface{}) {
	dur := taskCtx.FormatDuration(ctx)
	msg := fmt.Sprintf(format, args...)
	log.CallerStdout(ctx, fmt.Sprintf(">> 200 %v (%v)", msg, dur))
}
