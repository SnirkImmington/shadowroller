package routes

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"github.com/janberktold/sse"
	"log"
	"net/http"
	"sr/config"
	"strings"
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

// closeRedis closes the redis connection and logs any errors found
func closeRedis(request *Request, conn redis.Conn) {
	if config.RedisConnectionsDebug {
		rawLog(1, request, "Called closeRedis with conn %p", conn)
	}
	if conn == nil {
		rawLog(1, request, "nil connection passed to closeRedis")
		return
	}
	if err := conn.Close(); err != nil {
		rawLog(1, request, "Error closing redis connection: %v", err)
	}
}

func requestRemoteAddr(request *Request) string {
	if config.ClientIPHeader != "" {
		res := request.Header.Get(config.ClientIPHeader)
		if res != "" {
			return res
		}
	}
	return request.RemoteAddr
}

func requestRemoteIP(request *Request) string {
	addr := requestRemoteAddr(request)
	portIx := strings.LastIndex(addr, ":")
	if portIx == -1 {
		return addr
	}
	return addr[:portIx]
}

func cacheIndefinitely(request *Request, response Response) {
	rawLog(1, request, "Caching for 24 hours")
	response.Header().Set("Cache-Control", "max-age=86400")
}

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

func logRequest(request *Request) {
	if config.IsProduction {
		extra := ""
		if len(config.LogExtraHeaders) != 0 {
			grabbed := make([]string, len(config.LogExtraHeaders))
			for i, header := range config.LogExtraHeaders {
				found := request.Header.Get(header)
				if found != "" {
					grabbed[i] = found
				} else {
					grabbed[i] = "??"
				}
			}
			extra = fmt.Sprintf(" %v", grabbed)
		}
		rawLog(1, request,
			"<< %v%v %v %v %v",
			requestRemoteIP(request),
			extra,
			request.Proto,
			request.Method,
			request.URL,
		)
	} else {
		rawLog(1, request, "<< %v %v", request.Method, request.URL)
	}
}

func logFrontendRequest(request *Request) {
	if config.IsProduction {
		extra := ""
		if len(config.LogExtraHeaders) != 0 {
			grabbed := make([]string, len(config.LogExtraHeaders))
			for i, header := range config.LogExtraHeaders {
				found := request.Header.Get(header)
				if found != "" {
					grabbed[i] = found
				} else {
					grabbed[i] = "??"
				}
			}
			extra = fmt.Sprintf(" %v", grabbed)
		}
		rawLog(1, request,
			"<* %v%v %v %v %v",
			requestRemoteIP(request),
			extra,
			request.Proto,
			request.Method,
			request.URL,
		)
	} else {
		rawLog(1, request, "<* %v %v", request.Method, request.URL)
	}
}

func logf(request *Request, format string, values ...interface{}) {
	rawLog(1, request, format, values...)
}

func rawLog(stack int, request *Request, format string, values ...interface{}) {
	id := requestID(request.Context())
	var message string
	if len(values) == 0 {
		message = format
	} else {
		message = fmt.Sprintf(format, values...)
	}
	var logText string
	if config.IsProduction {
		logText = fmt.Sprintf("%03x %v", id, message)
	} else {
		logText = fmt.Sprintf("\033[38;5;%vm%02x\033[m %v\n", id, id, message)
	}
	err := log.Output(2+stack, logText)
	if err != nil {
		log.Print(id, " [Output Error] ", message)
	}
}

func httpSuccess(response Response, request *Request, message ...interface{}) {
	if len(message) == 0 {
		message = []interface{}{"OK"}
	}
	dur := displayRequestDuration(request.Context())
	rawLog(1, request, fmt.Sprintf(">> 200 %v (%v)", fmt.Sprint(message...), dur))
}

func logServedContent(response Response, request *Request, fileName string, zipped bool) {
	dur := displayRequestDuration(request.Context())
	msg := "zipped"
	if !zipped {
		msg = "unzipped"
	}
	rawLog(1, request, fmt.Sprintf("*> Served %v %v (%v)", fileName, msg, dur))
}
