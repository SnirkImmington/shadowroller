package routes

import (
	"net/http"
	redisUtil "sr/redis"

	"github.com/go-redis/redis/v8"
)

// HandlerFunc is used for the implementation of HTTP handlers in order to make
// testing mocks easier.
type HandlerFunc func(response Response, request *Request, client *redis.Client)

// Wrap converts a Shadowroller HTTP Handler into a `net/http.HandlerFunc`.
func Wrap(handler HandlerFunc) http.HandlerFunc {
	return func(response Response, request *Request) {
		logRequest(request)
		handler(response, request, redisUtil.Client)
	}
}
