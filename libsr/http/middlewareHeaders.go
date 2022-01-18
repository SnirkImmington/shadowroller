package http

import (
	netHTTP "net/http"

	"shadowroller.net/libsr/config"
)

// universalHeadersMiddleware adds headers to all responses.
// Currently, only `X-Content-TypeOptions: nosniff` is needed.
func UniversalHeadersMiddleware(wrapped netHTTP.Handler) netHTTP.Handler {
	return netHTTP.HandlerFunc(func(response Response, request Request) {
		response.Header().Set("X-Content-Type-Options", "nosniff")
		wrapped.ServeHTTP(response, request)
	})
}

// tlsHeadersMiddleware adds headers for all TLS requests. Currently only
// an STS header is added.
func TLSHeadersMiddleware(wrapped netHTTP.Handler) netHTTP.Handler {
	return netHTTP.HandlerFunc(func(response Response, request Request) {
		response.Header().Set("Strict-Transport-Security", "max-age=31536000")
		wrapped.ServeHTTP(response, request)
	})
}

// restHeadersMiddleware adds headers for all REST API requests. Currently
// only `Cache-Control: no-store` is added.
func RESTHeadersMiddleware(wrapped netHTTP.Handler) netHTTP.Handler {
	return netHTTP.HandlerFunc(func(response Response, request Request) {
		response.Header().Set("Cache-Control", "no-store")
		wrapped.ServeHTTP(response, request)
	})
}

// frontendHeadersMiddleware adds headers for all frontend (HTTP) requests.
// It adds X-Frame-Options and Content-Security-Policy
func FrontendHeadersMiddleware(wrapped netHTTP.Handler) netHTTP.Handler {
	return netHTTP.HandlerFunc(func(response Response, request Request) {
		response.Header().Set("X-Frame-Options", "DENY")
		response.Header().Set(
			"Content-Security-Policy",
			"default-src 'self' "+config.BackendOrigin.String()+"; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'",
		)
		wrapped.ServeHTTP(response, request)
	})
}
