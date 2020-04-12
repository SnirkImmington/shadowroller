// Request middleware(s) for all requests.
package srserver

import (
	"encoding/json"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"log"
	"net/http"
	"srserver/config"
	"time"
)

var redisPool = &redis.Pool{
	MaxIdle:     10,
	IdleTimeout: time.Duration(60) * time.Second,
	Dial: func() (redis.Conn, error) {
		return redis.DialURL(config.RedisUrl)
	},
}

func readBodyJSON(request *Request, value interface{}) error {
	decoder := json.NewDecoder(request.Body)
	return decoder.Decode(value)
}

func writeBodyJSON(response Response, value interface{}) error {
	return json.NewEncoder(response).Encode(value)
}

func httpUnauthorized(response Response, err error) {
	message := fmt.Sprintf("-> 401 Unauthorized: %v", err)
	log.Output(2, message)
	http.Error(response, "Unauthorized", http.StatusUnauthorized)
}

func httpInternalError(response Response, request *Request, err error) {
	logMessage := fmt.Sprintf("Internal error handling %s %s: %v", request.Method, request.URL, err)
	log.Output(2, logMessage)
	if config.IsProduction {
		log.Print("-> 500 Internal Error")
		http.Error(response, "Internal Server Error", http.StatusInternalServerError)
	} else {
		log.Printf("-> 500 %w", err)
		http.Error(response, logMessage, http.StatusInternalServerError)
	}
}

func httpInternalErrorMessage(response Response, request *Request, message interface{}) {
	logMessage := fmt.Sprintf("Internal error handling %s %s: %v", request.Method, request.URL, message)
	log.Output(2, logMessage)
	if config.IsProduction {
		log.Print("-> 500 Internal Error")
		http.Error(response, "Internal Server Error", http.StatusInternalServerError)
	} else {
		log.Print("-> 500 ", message)
		http.Error(response, logMessage, http.StatusInternalServerError)
	}
}

func httpInvalidRequest(response Response, message string) {
	logMessage := "Invalid request: " + message
	log.Print("->", http.StatusBadRequest, logMessage)
	http.Error(response, logMessage, http.StatusBadRequest)
}

func httpSuccess(response Response) {
	log.Print("-> 200 OK")
	http.Error(response, "", http.StatusOK)
}
