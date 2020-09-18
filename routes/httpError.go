package routes

import (
	"net/http"
	"sr"
)

var abortedRequestPanicMessage = string(sr.GenUID())

func abortRequest() {
	panic(abortedRequestPanicMessage)
}

func httpDoErrorIf(message string, status int, response Response, request *Request, err error) {
	if err != nil {
		http.Error(response, message, status)
		dur := displayRequestDuration(request.Context())
		rawLog(2, request, ">> %v %v: %v (%v)", status, message, err.Error(), dur)
		abortRequest()
	}
}

func httpDoMessage(template string, status int, response Response, request *Request, message string) {
	if message == "" {
		message = template
	}
	http.Error(response, message, status)
	dur := displayRequestDuration(request.Context())
	rawLog(2, request, ">> %v %v (%v)", status, message, dur)
	abortRequest()
}

func httpBadRequestIf(response Response, request *Request, err error) {
	httpDoErrorIf("Bad Request", http.StatusBadRequest, response, request, err)
}

func httpBadRequest(response Response, request *Request, message string) {
	httpDoMessage("Bad Request", http.StatusBadRequest, response, request, message)
}

func httpForbiddenIf(response Response, request *Request, err error) {
	httpDoErrorIf("Forbidden", http.StatusForbidden, response, request, err)
}

func httpForbidden(response Response, request *Request, message string) {
	httpDoMessage("Forbidden", http.StatusForbidden, response, request, message)
}

func httpNotFoundIf(response Response, request *Request, err error) {
	httpDoErrorIf("Not Found", http.StatusNotFound, response, request, err)
}

func httpNotFound(response Response, request *Request, message string) {
	httpDoMessage("Not Found", http.StatusNotFound, response, request, message)
}

func httpUnauthorizedIf(response Response, request *Request, err error) {
	httpDoErrorIf("Unauthorized", http.StatusUnauthorized, response, request, err)
}

func httpUnauthorized(response Response, request *Request, message string) {
	httpDoMessage("Unauthorized", http.StatusUnauthorized, response, request, message)
}

func httpInternalErrorIf(response Response, request *Request, err error) {
	httpDoErrorIf("Internal Server Error", http.StatusInternalServerError, response, request, err)
}

func httpInternalError(response Response, request *Request, message string) {
	httpDoMessage("Internal Server Error", http.StatusInternalServerError, response, request, message)
}
