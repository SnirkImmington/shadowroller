package srserver

import (
	"fmt"
	"log"
	"net/http"
	"runtime/debug"
	"srserver/config"
)

func loggingMiddleware(wrapped http.HandlerFunc) http.HandlerFunc {
	return func(response Response, request *Request) {
		if config.IsProduction {
			log.Println(request.Proto, request.Method, request.RequestURI)
		} else {
			log.Println(request.Method, request.RequestURI)
		}
		wrapped(response, request)
	}
}

func recoveryMiddleware(wrapped http.HandlerFunc) http.HandlerFunc {
	return func(response Response, request *Request) {
		defer func() {
			if err := recover(); err != nil {
				message := fmt.Sprintf("Panic serving %s %s to %s", request.Method, request.RequestURI, request.Host)
				log.Println(message)
				log.Println(string(debug.Stack()))
				if config.IsProduction {
					http.Error(response, "Internal Server Error", http.StatusInternalServerError)
				} else {
					http.Error(response, fmt.Sprintf("%v", err), http.StatusInternalServerError)
				}
			}
		}()
		wrapped(response, request)
	}
}

func rateLimitedMiddleware(wrapped HandlerFunc) http.HandlerFunc {
	return func(response Response, request *Request) {
		conn := redisPool.Get()
		defer conn.Close()

		// Taken from https://redis.io/commands/incr#pattern-rate-limiter-1

		// Interesting ambiguity in Go's time docs:
		// They made a big fuss about recognizing that wall time
		// is not monotonic and that this is often confusing to
		// programmers, but rather than adding a monotonic time API
		// to distinguish the fact that monotonic time is entirely
		// system dependent, can be irrelevant cross-process, and
		// should not be treated the same way as wall time, they
		// added another field to the Time object and wrote some
		// suggestive comments in the API saying they would pick
		// for you which time they think you're looking for based
		// on what API methods you're calling with it.

		// I don't know if using the unix timestamp will be accurate
		// across leap seconds or daylight savings. I could go look
		// it up on Wikipedia and check my OS's implementation,
		// but it doesn't matter for this application. Feel free
		// to spam more requests around DST transitions and leap seconds.
		ts := time.Now().Unix() % 60
		rateLimitKey := "ratelimit." + request.RemoteAddr + "." + string(ts)

		current, err := redis.Int(conn.Do("get", rateLimitKey))
		if err != nil {
			// oops
		}

		if current > 10 { // config.RequestsPerMinute
			log.Print("Rate limit for", request.RemoteAddr, "hit")
			http.Error(response, "Rate limited", 400)
			return
		} else {
			conn.Send("multi")
			conn.Send("incr", rateLimitKey)
			conn.Send("expire", rateLimitKey, 60)
			err := conn.Send("exec")
			if err != nil {
				// oops
			}
		}

		wrapped(response, request)
	}
}
