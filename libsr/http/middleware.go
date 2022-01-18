package http

import (
	"fmt"
	netHTTP "net/http"
	"runtime/debug"
	"time"

	"shadowroller.net/libsr/config"
	"shadowroller.net/libsr/errs"
	"shadowroller.net/libsr/log"
	srOtel "shadowroller.net/libsr/otel"
	redisUtil "shadowroller.net/libsr/redis"
	"shadowroller.net/libsr/taskCtx"

	"github.com/go-redis/redis/v8"
	"go.opentelemetry.io/otel/trace"
)

func RequestContextMiddleware(wrapped netHTTP.Handler) netHTTP.Handler {
	return netHTTP.HandlerFunc(func(response Response, request Request) {
		ctx := request.Context()
		if taskCtx.GetID(ctx) == 0 {
			ctx = taskCtx.WithID(ctx)
		}
		ctx = taskCtx.WithStartNow(ctx)
		requestWithID := request.WithContext(ctx)

		wrapped.ServeHTTP(response, requestWithID)
	})
}

func LocalhostOnlyMiddleware(wrapped netHTTP.Handler) netHTTP.Handler {
	return netHTTP.HandlerFunc(func(response Response, request Request) {
		remoteAddr := RequestRemoteIP(request)
		allowed := remoteAddr == "localhost" || remoteAddr == "127.0.0.1" || remoteAddr == "[::1]"
		message := "disallowed"
		if allowed {
			message = "allowed"
		}
		log.Printf(request.Context(), "localhostOnly: %v %v", RequestRemoteAddr(request), message)
		if !allowed {
			netHTTP.Error(response, "Not found", netHTTP.StatusNotFound)
			return
		}
		wrapped.ServeHTTP(response, request)
	})
}

func HaltMiddleware(wrapped netHTTP.Handler) netHTTP.Handler {
	return netHTTP.HandlerFunc(func(response Response, request Request) {
		defer func() {
			errVal := recover()
			if errVal == nil || errVal == errs.ErrHalt {
				return
			}
			err, ok := errVal.(error)
			if !ok {
				panic(fmt.Errorf("panicking without an error: %v", err))
			}
			if errs.IsSpecified(err) {
				code := errs.HTTPCode(err)
				response.WriteHeader(code)
				return
			}
			panic(fmt.Errorf("unexpected error %v", err))
		}()
		wrapped.ServeHTTP(response, request)
	})
}

func RecoveryMiddleware(wrapped netHTTP.Handler) netHTTP.Handler {
	return netHTTP.HandlerFunc(func(response Response, request Request) {
		defer func() {
			if errVal := recover(); errVal != nil {
				err, ok := errVal.(error)
				if !ok {
					err = fmt.Errorf("non-error panic: %v", err)
				}
				ctx := request.Context()
				span := trace.SpanFromContext(ctx)
				srOtel.WithSetError(span, err, trace.WithStackTrace(true))
				log.Stdoutf(ctx, "Panic serving %v %v: %v",
					request.Method, request.URL, errVal,
				)
				log.Stdoutf(ctx, string(debug.Stack()))
				netHTTP.Error(response, "Internal Server Error", netHTTP.StatusInternalServerError)
				dur := taskCtx.FormatDuration(request.Context())
				log.Stdoutf(ctx, ">> 500 Internal Server Error (%v)", dur)
			}
		}()
		wrapped.ServeHTTP(response, request)
	})
}

func RateLimitedMiddleware(wrapped netHTTP.Handler) netHTTP.Handler {
	return RateLimitedHandler(wrapped, redisUtil.Client)
}

func RateLimitedHandler(wrapped netHTTP.Handler, client redis.Cmdable) netHTTP.Handler {
	return netHTTP.HandlerFunc(func(response Response, request Request) {
		// Taken from https://redis.io/commands/incr#pattern-rate-limiter-1
		remoteAddr := RequestRemoteIP(request)
		ts := time.Now().Unix()
		rateLimitKey := fmt.Sprintf("ratelimit:%v:%v", remoteAddr, ts-ts%10)
		ctx := request.Context()

		current, err := client.Get(ctx, rateLimitKey).Int()
		if err == redis.Nil {
			current = 0
		} else if err != nil {
			log.Printf(ctx, "Unable to get rate limit key: %v", err)
			HaltInternal(ctx, err)
		}

		limited := false
		if current > config.MaxRequestsPer10Secs {
			log.Printf(ctx, "Rate limit for %v hit", remoteAddr)
			netHTTP.Error(response, "Rate limited", netHTTP.StatusTooManyRequests)
			limited = true
		}

		_, err = client.Pipelined(ctx, func(pipe redis.Pipeliner) error {
			const expiration = 15 * time.Second
			pipe.Incr(ctx, rateLimitKey)
			pipe.Expire(ctx, rateLimitKey, expiration)
			return nil
		})
		HaltInternal(ctx, err)

		if !limited {
			wrapped.ServeHTTP(response, request)
		}
	})
}
