package routes

import (
	"fmt"
	"time"

	"sr/config"
	srHTTP "sr/http"
	"sr/log"

	"github.com/janberktold/sse"
)

var sseUpgrader = sse.Upgrader{
	RetryTime: time.Duration(config.SSEClientRetrySecs) * time.Second,
}

type updateEventRequest struct {
	ID   int64                  `json:"id"`
	Diff map[string]interface{} `json:"diff"`
}

func cacheIndefinitely(request srHTTP.Request, response srHTTP.Response) {
	log.CallerPrint(request.Context(), "Caching for 24 hours")
	response.Header().Set("Cache-Control", "max-age=86400")
}

func logFrontendRequest(request srHTTP.Request, name string) {
	file, line := log.FileAndLine(2)
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
		log.RawPrint(request.Context(), file, line, fmt.Sprintf(
			"<* %v%v %v %v %v %v",
			srHTTP.RequestRemoteIP(request),
			extra,
			request.Proto,
			request.Method,
			request.URL,
			name,
		))
	} else {
		log.RawPrint(request.Context(), file, line, fmt.Sprintf(
			"<* %v %v %v", request.Method, request.URL, name,
		))
	}
}
