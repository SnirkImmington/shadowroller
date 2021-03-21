package routes

import (
	"bytes"
	"encoding/base64"
	"github.com/gomodule/redigo/redis"
	"net/http"
	"sr/config"
	redisUtil "sr/redis"
	"strings"
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

var _ = restRouter.HandleFunc("/health-check", handleHealthCheck).Methods("GET")

func handleHealthCheck(response Response, request *Request) {
	logRequest(request)

	conn := redisUtil.Connect()
	defer closeRedis(request, conn)

	ok, err := redis.Bool(conn.Do("exists", "auth_version"))
	httpInternalErrorIf(response, request, err)
	if !ok {
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
	gameCount, err := redis.Int(conn.Do("keys", "game:*"))
	httpInternalErrorIf(response, request, err)

	sessionCount, err := redis.Int(conn.Do("keys", "session:*"))
	httpInternalErrorIf(response, request, err)

	resp := healthCheckResponse{
		Games:    gameCount,
		Sessions: sessionCount,
	}
	err = writeBodyJSON(response, &resp)
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request,
		gameCount, " games ", sessionCount, " sessions",
	)
}
