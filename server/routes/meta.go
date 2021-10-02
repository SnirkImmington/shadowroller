package routes

import (
	"bytes"
	"encoding/base64"
	"net/http"
	"sr/config"
	"strings"

	"github.com/go-redis/redis/v8"
)

func handleRoot(response Response, request *Request) {
	logRequest(request)
	response.Header().Set("Content-Type", "text/plain")
	httpNotFound(response, request, "Yep, this is the API.")
}

func handleFrontendRedirect(response Response, request *Request) {
	var status int
	if config.FrontendRedirectPermanent {
		status = http.StatusMovedPermanently
		response.Header().Set("Cache-Control", "max-age=31536000, public, immutable")
	} else {
		status = http.StatusSeeOther
		response.Header().Add("Cache-Control", "max-age=86400, public")
	}
	http.Redirect(response, request, config.FrontendOrigin.String(), status)
	dur := displayRequestDuration(request.Context())
	logf(request, ">> %v Redirect %v (%v)", status, config.FrontendOrigin.String(), dur)
}

var _ = restRouter.HandleFunc("/robots.txt", handleRobots).Methods("GET")

func handleRobots(response Response, request *Request) {
	logRequest(request)
	// No bots in the API please
	response.Header().Set("Content-Type", "text/plain")
	response.Header().Set("Cache-Control", "max-age=31536000, public, immutable")
	_, err := response.Write([]byte("user-agent: *\ndisallow: *"))
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request, "user-agent: * disallow: *")
}

var _ = restRouter.HandleFunc("/coffee", handleCoffee).Methods("GET")

func handleCoffee(response Response, request *Request) {
	logRequest(request)
	response.Header().Set("Content-Type", "text/plain")
	http.Error(response, "Soy coffee only", http.StatusTeapot)
	cacheIndefinitely(request, response)
	logf(request, ">> 418 Soy coffee only")
}

type healthCheckResponse struct {
	Games    int `json:"games"`
	Sessions int `json:"sessions"`
}

var _ = restRouter.HandleFunc("/health-check", Wrap(handleHealthCheck)).Methods("GET")

func handleHealthCheck(response Response, request *Request, client *redis.Client) {
	ctx := request.Context()
	found, err := client.Exists(ctx, "auth_version").Result()
	httpInternalErrorIf(response, request, err)
	if found != 1 {
		httpInternalError(response, request, "Server is not healthy!")
	}

	// Check if we're just saying ok
	if config.IsProduction && len(config.HealthCheckSecretKey) == 0 {
		httpSuccess(response, request, "OK (skip extra info)")
		return
	}

	// Get creds (auth only checked in production)
	if config.IsProduction {
		auth := request.Header.Get("Authentication")
		if !strings.HasPrefix(auth, "Bearer ") {
			httpSuccess(response, request, "OK (missing auth for extra info)")
			return
		}
		key, err := base64.StdEncoding.DecodeString(auth[8:])
		if err != nil {
			logf(request, "Error decoding auth key: %v", err)
			httpSuccess(response, request, "OK (error decoding key)")
			return
		}
		if !bytes.Equal(key, config.HealthCheckSecretKey) {
			httpSuccess(response, request, "OK (attempted to auth with bad key)")
			return
		}
	}

	// Okay, send them stuff
	games, err := client.Keys(ctx, "game:*").Result()
	httpInternalErrorIf(response, request, err)

	sessions, err := client.Keys(ctx, "session:*").Result()
	httpInternalErrorIf(response, request, err)

	resp := healthCheckResponse{
		Games:    len(games),
		Sessions: len(sessions),
	}
	err = writeBodyJSON(response, &resp)
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request,
		resp.Games, " games, ", resp.Sessions, " sessions",
	)
}
