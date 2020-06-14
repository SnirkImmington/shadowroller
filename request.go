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

type Request = http.Request
type Response = http.ResponseWriter

type HandlerFunc = func(Response, *Request)

var redisPool = &redis.Pool{
	MaxIdle:     10,
	IdleTimeout: time.Duration(60) * time.Second,
	Dial: func() (redis.Conn, error) {
		return redis.DialURL(config.RedisUrl)
	},
}

func closeRedis(conn redis.Conn) {
	err := conn.Close()
	if err != nil {
		log.Printf("Error closing redis connection: %v", err)
	}
}

func readBodyJSON(request *Request, value interface{}) error {
	return json.NewDecoder(request.Body).Decode(value)
}

func writeBodyJSON(response Response, value interface{}) error {
	response.Header().Set("Content-Type", "text/json")
	return json.NewEncoder(response).Encode(value)
}

func logRequest(request *Request, values ...string) {
	var message string
	if config.IsProduction {
		message = fmt.Sprintf(
			"<- %v %v %v %v",
			request.RemoteAddr, request.Proto, request.Method, request.RequestURI,
		)
	} else {
		message = fmt.Sprintf("<- %v %v", request.Method, request.RequestURI)
	}
	log.Output(2, message)
}

func httpNotFound(response Response) {
	log.Output(2, "-> 404 not found")
	http.Error(response, "Not found", 404)
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
		log.Output(2, "-> 500 Internal Error")
		http.Error(response, "Internal Server Error", http.StatusInternalServerError)
	} else {
		log.Output(2, "-> 500 "+err.Error())
		http.Error(response, logMessage, http.StatusInternalServerError)
	}
}

func httpInternalErrorMessage(response Response, request *Request, message interface{}) {
	logMessage := fmt.Sprintf("Internal error handling %s %s: %v", request.Method, request.URL, message)
	log.Output(2, logMessage)
	if config.IsProduction {
		log.Output(2, "-> 500 Internal Server Error")
		http.Error(response, "Internal Server Error", http.StatusInternalServerError)
	} else {
		log.Output(2, "-> 500 "+logMessage)
		http.Error(response, logMessage, http.StatusInternalServerError)
	}
}

func httpInvalidRequest(response Response, message string) {
	logMessage := "Invalid request: " + message
	log.Output(2, "-> 400 "+logMessage)
	http.Error(response, logMessage, http.StatusBadRequest)
}

func httpSuccess(response Response, message ...interface{}) {
	if len(message) == 0 {
		message = []interface{}{"OK"}
	}
	log.Output(2, "-> 200 "+fmt.Sprint(message...))
}
