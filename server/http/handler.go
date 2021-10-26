package http

import (
	"context"
	"fmt"
	netHTTP "net/http"
	"strings"

	"sr/config"
	"sr/log"
	redisUtil "sr/redis"
	"sr/session"

	"go.opentelemetry.io/otel/trace"

	"github.com/go-redis/redis/v8"
	"github.com/gorilla/mux"
)

type Response = netHTTP.ResponseWriter
type Request = *netHTTP.Request

type Args struct {
	Ctx      context.Context
	Response Response
	Request  *netHTTP.Request
	Client   *redis.Client
	Method   string
	Path     string
	Span     trace.Span
}

func (a *Args) Get() (context.Context, Response, Request, *redis.Client, trace.Span) {
	if a.Client == nil {
		panic(fmt.Errorf("Got a nil client???"))
	}
	return a.Ctx, a.Response, a.Request, a.Client, a.Span
}

func (a *Args) MustSession() (context.Context, Response, Request, *redis.Client, *session.Session) {
	ctx, response, request, client, _ := a.Get()
	sess, err := RequestSession(request, client)
	Halt(ctx, err)
	return ctx, response, request, client, sess
}

type Handler func(args *Args)

// HandlerFunc is used for the implementation of HTTP handlers in order to make
// testing mocks easier.
type HandlerFunc func(response Response, request Request, client *redis.Client)

func Handle(router *mux.Router, pathAndMethod string, handler Handler) *mux.Route {
	file, line := log.FileAndLine(1)
	line += 2
	return HandleWith(router, pathAndMethod, handler, file, line, redisUtil.Client)
}

func HandleGet(router *mux.Router, path string, handler Handler) *mux.Route {
	file, line := log.FileAndLine(1)
	line += 2
	return HandleWith(router, "GET "+path, handler, file, line, redisUtil.Client)
}

func HandlePost(router *mux.Router, path string, handler Handler) *mux.Route {
	file, line := log.FileAndLine(1)
	line += 2
	return HandleWith(router, "POST "+path, handler, file, line, redisUtil.Client)
}

func HandleWith(router *mux.Router, pathAndMethod string, handler Handler, file string, line int, client *redis.Client) *mux.Route {
	split := strings.SplitN(pathAndMethod, " ", 2)
	if len(split) != 2 {
		panic(fmt.Errorf("srHTTP.Handle: invalid path %v", pathAndMethod))
	}
	method := split[0]
	path := split[1]
	var fullPath string
	muxHandler := func(response Response, request Request) {
		ctx := request.Context()
		span := trace.SpanFromContext(ctx)
		if client == nil {
			client = redisUtil.Client
		}
		args := &Args{
			Ctx:      ctx,
			Response: response,
			Request:  request,
			Client:   client,
			Span:     span,
			Method:   method,
			Path:     path,
		}
		logRequest(request, fullPath, file, line)
		handler(args)
	}
	route := router.HandleFunc(path, muxHandler).Methods(method)
	fullPath, err := route.GetPathTemplate()
	if err != nil {
		fullPath = "UNKNOWN PATH"
	}
	return route
}

// Wrap converts a Shadowroller HTTP handler into a `net/httpHandlerFunc`.
func Wrap(handler HandlerFunc) netHTTP.HandlerFunc {
	// This can be used to simulate calling log at the beginning of the handler.
	file, line := log.FileAndLine(2)
	if line > 3 {
		line -= 2
	}
	return func(response Response, request Request) {
		logRequest(request, request.URL.Path, file, line)
		handler(response, request, redisUtil.Client)
	}
}

func standardizeHeaderName(headerName string) string {
	return strings.ReplaceAll(strings.ToLower(headerName), "-", "_")
}

// logRequest is meant to be called from Wrap. It simulates calling `log.Stdout`
// from the beginning of the handler by assuming the handler is written two lines
// under the call to Wrap.
func logRequest(request Request, path string, file string, line int) {
	ctx := request.Context()
	if !config.IsProduction {
		message := fmt.Sprintf(
			"<< %v %v", request.Method, path,
		)
		log.RawStdout(ctx, file, line, message)
		return
	}
	// On prod, we also print extra headers
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
	message := fmt.Sprintf(
		"<< %v%v %v %v %v",
		RequestRemoteIP(request), extra,
		request.Proto, request.Method, request.URL,
	)
	log.RawStdout(ctx, file, line, message)
}
