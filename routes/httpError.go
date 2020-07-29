package routes

import (
	"net/http"
	"sr"
)

var abortedRequestPanicMessage = string(sr.GenUID())

func abortRequest() {
	panic(abortedRequestPanicMessage)
}

func httpBadRequestIf(response Response, request *Request, err error) {
	if err != nil {
		rawLog(request, ">> 400 Bad Request: "+err.Error())
		http.Error(response, "Bad Request", http.StatusBadRequest)
		abortRequest()
	}
}

func httpBadRequest(response Response, request *Request, message string) {
	if message == "" {
		message = "Bad Request"
	}
	rawLog(request, ">> 400 "+message)
	http.Error(response, message, http.StatusBadRequest)
	abortRequest()
}

func httpForbiddenIf(response Response, request *Request, err error) {
	if err != nil {
		rawLog(request, ">> 403 Forbidden: "+err.Error())
		http.Error(response, "Forbidden", http.StatusForbidden)
		abortRequest()
	}
}

func httpForbidden(response Response, request *Request, message string) {
	if message == "" {
		message = "Forbidden"
	}
	rawLog(request, ">> 403 "+message)
	http.Error(response, message, http.StatusForbidden)
	abortRequest()
}

func httpNotFoundIf(response Response, request *Request, err error) {
	if err != nil {
		rawLog(request, ">> 404 Not Found: "+err.Error())
		http.Error(response, "Not Found", http.StatusNotFound)
		abortRequest()
	}
}

func httpNotFound(response Response, request *Request, message string) {
	if message == "" {
		message = "Not Found"
	}
	rawLog(request, ">> 404 "+message)
	http.Error(response, message, http.StatusNotFound)
	abortRequest()
}

func httpUnauthorizedIf(response Response, request *Request, err error) {
	if err != nil {
		rawLog(request, ">> 401 Unauthorized: "+err.Error())
		http.Error(response, "Unauthorized", http.StatusUnauthorized)
		abortRequest()
	}
}

func httpUnauthorized(response Response, request *Request, message string) {
	if message == "" {
		message = "Unauthorized"
	}
	rawLog(request, ">> 401 "+message)
	http.Error(response, message, http.StatusUnauthorized)
	abortRequest()
}

func httpInternalErrorIf(response Response, request *Request, err error) {
	if err != nil {
		rawLog(request, ">> 500 Internal Server Error: "+err.Error())
		http.Error(response, "Internal Server Error", http.StatusInternalServerError)
		abortRequest()
	}
}

func httpInternalError(response Response, request *Request, message string) {
	if message == "" {
		message = "Internal Server Error"
	}
	rawLog(request, ">> 500 "+message)
	http.Error(response, message, http.StatusInternalServerError)
	abortRequest()
}
