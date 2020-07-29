package routes

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/janberktold/sse"
	"log"
	"net/http"
	"sr/config"
	"time"
)

var sseUpgrader = sse.Upgrader{
	RetryTime: time.Duration(config.SSEClientRetrySecs) * time.Second,
}

// Request is an alias for http.Request
type Request = http.Request

// Response is an alias for http.ResponseWriter
type Response = http.ResponseWriter

var errExtraBody = errors.New("encountered additional data after end of JSON body")

func readBodyJSON(request *Request, value interface{}) error {
	decoder := json.NewDecoder(request.Body)
	decoder.DisallowUnknownFields()
	err := decoder.Decode(value)
	if err != nil {
		return err
	}
	if decoder.More() {
		return errExtraBody
	}
	return nil
}

func writeBodyJSON(response Response, value interface{}) error {
	response.Header().Set("Content-Type", "text/json")
	return json.NewEncoder(response).Encode(value)
}

func logRequest(request *Request, values ...string) {
	if config.IsProduction {
		rawLog(request, fmt.Sprintf(
			"<< %v %v %v %v",
			request.RemoteAddr, request.Proto, request.Method, request.URL,
		))
	} else {
		rawLog(request, fmt.Sprintf("<< %v %v",
			request.Method, request.URL,
		))
	}
}

func logf(request *Request, format string, values ...interface{}) {
	message := fmt.Sprintf(format, values...)
	rawLog(request, message)
}

func rawLog(request *Request, message string) {
	id := requestID(request)
	err := log.Output(3, id+" "+message)
	if err != nil {
		log.Print(id, " [Output Error] ", message)
	}
}

func httpSuccess(response Response, request *Request, message ...interface{}) {
	if len(message) == 0 {
		message = []interface{}{"OK"}
	}
	rawLog(request, fmt.Sprintf(">> 200 %v", fmt.Sprint(message...)))
}
