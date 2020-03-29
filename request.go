// Request middleware(s) for all requests.
package srserver

import (
	"encoding/json"
	"github.com/gomodule/redigo/redis"
	"log"
	"net/http"
	"srserver/config"
	"time"
)

//responseLogger := Logger

type HandlerFunc = func(http.ResponseWriter, *http.Request) // TODO add params
type RedisHandlerFunc = func(http.ResponseWriter, *http.Request, redis.Conn)

var redisPool = &redis.Pool{
	MaxIdle:     10,
	IdleTimeout: time.Duration(60) * time.Second,
	Dial: func() (redis.Conn, error) {
		return redis.DialURL(config.RedisUrl)
	},
}

func makeRequestHandler(wrapped HandlerFunc) http.HandlerFunc {
	return func(response http.ResponseWriter, request *http.Request) {
		// Timing?
		if config.IsProduction {
			log.Println(request.Proto, request.Method, request.RequestURI)
		} else {
			log.Println(request.Method, request.URL)
		}
		defer func() {
			if err := recover(); err != nil {
				log.Println("Panic serving", request.Method, request.URL, "to", request.Host)
				// TODO print stack trace (minus the wrapper of this fn + makeRequestHandler)
				log.Println("staaaaaaaaaaaaaaaack traaaaaaaaaaaaaaaaaaaace")
				http.Error(response, "Internal Server Error", http.StatusInternalServerError)
			}
		}()
		wrapped(response, request /* */)
		// We could return a value here to be logged
		//log.Println("Response:", response.Status)
	}
}

func makeRedisRequestHandler(wrapped RedisHandlerFunc) http.HandlerFunc {
	return makeRequestHandler(func(response http.ResponseWriter, request *http.Request) {
		redisConn := redisPool.Get()
		defer redisConn.Close()
		wrapped(response, request, redisConn)
	})
}

func readBodyJson(request *Request, value interface{}) error {
	decoder := json.NewDecoder(request.Body)
	return decoder.Decode(value)
}
