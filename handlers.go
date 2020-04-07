package srserver

import (
	"fmt"
	"log"
	"net/http"
	"runtime/debug"
	"srserver/config"
)

type Request = http.Request
type Response = http.ResponseWriter

type HandlerFunc = func(Response, *Request)

func loggedHandler(wrapped HandlerFunc) http.HandlerFunc {
	return func(response Response, request *Request) {
		if config.IsProduction {
			log.Println(request.Proto, request.Method, request.RequestURI)
		} else {
			log.Println(request.Method, request.URL)
		}
		defer func() {
			if err := recover(); err != nil {
				message := fmt.Sprintf("Panic serving", request.Method, request.URL, "to", request.Host)
				log.Println(message)
				log.Println(debug.Stack())
				http.Error(response, "Internal Server Error", http.StatusInternalServerError)
			}
		}()
		wrapped(response, request)
	}
}
