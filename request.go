// Request middleware(s) for all requests.

import (
	"log"
	"net/http"
)

responseLogger := Logger

type HandlerFunc = func(http.ResponseWriter, *http.Request) // TODO add params
type RedisHandlerFunc = func(http.ResponseWriter, *http.Request) // TODO add params & redis

func MakeRequestHandler(wrapped HandlerFunc) http.HandlerFunc {
	return func(response http.ResponseWriter, request *http.Request) {
		// Timing?
		// Logging?
		wrapped(response, request, /* */)
	}
}

func MakeRedisRequestHandler(wrapped RedisHandlerFunc) http.HandlerFunc {
	return MakeRequestHandler(func(response http.ResponseWriter, request *http.Request) {
		wrapped(response, request, /* */)
	})
}
