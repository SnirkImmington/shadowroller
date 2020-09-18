package routes

import (
	"fmt"
	"github.com/gomodule/redigo/redis"
	"net/http"
	"runtime/debug"
	"sr"
	"sr/config"
	"strings"
	"time"
)

func tlsHeadersMiddleware(wrapped http.Handler) http.Handler {
	return http.HandlerFunc(func(response Response, request *Request) {
		response.Header().Set("Strict-Transport-Security", "max-age=31536000")
		wrapped.ServeHTTP(response, request)
	})
}

func headersMiddleware(wrapped http.Handler) http.Handler {
	return http.HandlerFunc(func(response Response, request *Request) {
		response.Header().Set("Cache-Control", "no-store")
		response.Header().Set("X-Content-Type-Options", "nosniff")
		wrapped.ServeHTTP(response, request)
	})
}

func requestContextMiddleware(wrapped http.Handler) http.Handler {
	return http.HandlerFunc(func(response Response, request *Request) {
		requestCtx := withConnectedNow(withRequestID(request.Context()))
		requestWithID := request.WithContext(requestCtx)

		wrapped.ServeHTTP(response, requestWithID)
	})
}

func localhostOnlyMiddleware(wrapped http.Handler) http.Handler {
	return http.HandlerFunc(func(response Response, request *Request) {
		// Not sure if this should just be remote addr.
		remoteAddr := strings.Split(requestRemoteAddr(request), ":")[0]
		allowed := remoteAddr == "localhost" || remoteAddr == "127.0.0.1"
		message := "disallowed"
		if allowed {
			message = "allowed"
		}
		logf(request, "localhostOnly: %v %v", remoteAddr, message)
		if !allowed {
			httpNotFound(response, request, "Not found")
			return
		}
		wrapped.ServeHTTP(response, request)
	})
}

func recoveryMiddleware(wrapped http.Handler) http.Handler {
	return http.HandlerFunc(func(response Response, request *Request) {
		defer func() {
			if err := recover(); err != nil {
				if err == abortedRequestPanicMessage {
					return
				}
				logf(request, "Panic serving %v %v: %v",
					request.Method, request.URL, err,
				)
				logf(request, string(debug.Stack()))
				http.Error(response, "Internal Server Error", http.StatusInternalServerError)
				dur := displayRequestDuration(request.Context())
				logf(request, ">> 500 Internal Server Error (%v)", dur)
			}
		}()
		wrapped.ServeHTTP(response, request)
	})
}

func rateLimitedMiddleware(wrapped http.Handler) http.Handler {
	return http.HandlerFunc(func(response Response, request *Request) {
		conn := sr.RedisPool.Get()
		defer sr.CloseRedis(conn)

		// Taken from https://redis.io/commands/incr#pattern-rate-limiter-1

		remoteAddr := requestRemoteIP(request)
		ts := time.Now().Unix()
		rateLimitKey := fmt.Sprintf("ratelimit:%v:%v", remoteAddr, ts-ts%10)

		current, err := redis.Int(conn.Do("get", rateLimitKey))
		if err == redis.ErrNil {
			current = 0
		} else if err != nil {
			logf(request, "Unable to get rate limit key: %v", err)
			httpInternalErrorIf(response, request, err)
		}

		limited := false
		if current > config.MaxRequestsPer10Secs {
			logf(request, "Rate limit for %v hit", remoteAddr)
			http.Error(response, "Rate limited", http.StatusTooManyRequests)
			limited = true
		}

		err = conn.Send("multi")
		httpInternalErrorIf(response, request, err)
		err = conn.Send("incr", rateLimitKey)
		httpInternalErrorIf(response, request, err)
		err = conn.Send("expire", rateLimitKey, "15")
		httpInternalErrorIf(response, request, err)
		_, err = conn.Do("exec")
		httpInternalErrorIf(response, request, err)

		if !limited {
			wrapped.ServeHTTP(response, request)
		}
	})
}

func slowResponsesMiddleware(wrapped http.Handler) http.Handler {
	return http.HandlerFunc(func(response Response, request *Request) {
		logf(request, "Waiting 3 seconds to respond...")
		time.Sleep(3 * time.Second)
		wrapped.ServeHTTP(response, request)
	})
}
