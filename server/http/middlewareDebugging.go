package http

import (
	netHTTP "net/http"
	"time"

	"sr/log"
)

// slowResponsesMiddleware causes all requests to wait 3 seconds before replying.
func SlowResponsesMiddleware(wrapped netHTTP.Handler) netHTTP.Handler {
	return netHTTP.HandlerFunc(func(response Response, request Request) {
		log.Printf(request.Context(), "Waiting 3 seconds to respond...")
		time.Sleep(3 * time.Second)
		wrapped.ServeHTTP(response, request)
	})
}
