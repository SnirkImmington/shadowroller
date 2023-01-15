package http

import (
	"fmt"
	netHTTP "net/http"

	"sr/config"
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

func getCSP() string {
	return fmt.Sprintf(
		// See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy

		// Secure default for future policies to self and API
		// (other policies are not sent if they match default)
		"default-src 'self'; " +

		// Workers are not used yet
		"child-src 'none'; " +

		// Can make HTTP request to self and API
		"connect-src 'self' %[1]s;" +

		// Fonts are hosted in /static/
		// "font-src 'self'; " + // covered by default-src

		// No iframes are used
		"frame-src 'none'; " +

		// Images are hosted in /static/ or inlined SVG
		"img-src 'self' 'unsafe-inline'; " +

		// Manifest is hosted at frontend root
		// "manifest-src 'self'; " + // covered by default-src

		// We don't have any media objects
		// "media-src 'self'; " + // covered by default-src

		// Objects are legacy, not allowed
		"object-src 'none'; " +

		// Experimental. Prefetch isn't used yet, but we don't have significant external
		// links at the moment
		// "prefetch-src 'self'; " + // covered by default-src

		// Webpack(?) loading code is included inline
		"script-src 'self' 'unsafe-inline'; " +

		// Don't allow eval in event handlers
		"script-src-attr 'none'; " +

		// Inline stylesheets are created by styled-components
		"style-src 'self' 'unsafe-inline'; " +

		// Web workers are not used yet
		"worker-src 'none'; ",

		// Don't allow us to be iframed - also covered by x-frame-options
		"frame-ancestors: 'self'; ",

		// 1: backend origin, i.e. https://api.shadowroller.net
		config.BackendOrigin.String(),
	)
}

// frontendHeadersMiddleware adds headers for all frontend (HTTP) requests.
// It adds X-Frame-Options and Content-Security-Policy
func FrontendHeadersMiddleware(wrapped netHTTP.Handler) netHTTP.Handler {
	csp := getCSP()
	return netHTTP.HandlerFunc(func(response Response, request Request) {
		response.Header().Set("X-Frame-Options", "DENY")
		response.Header().Set("Content-Security-Policy", csp)
		wrapped.ServeHTTP(response, request)
	})
}

