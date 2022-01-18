package http

import (
	"sr/errs"
	"sr/log"
)

func ShouldNotBeCalledHandler(response Response, request Request) {
	file, line := log.FileAndLine(0)
	logRequest(request, request.URL.String(), file, line)
	Halt(request.Context(), errs.Internalf("Default handler called"))
}

func NotFoundHandler(response Response, request Request) {
	file, line := log.FileAndLine(0)
	logRequest(request, request.URL.String(), file, line)
	Halt(request.Context(), errs.NotFoundf("Not found"))
}
