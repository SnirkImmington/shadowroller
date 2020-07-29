package routes

import (
	"bytes"
	"encoding/base64"
	"github.com/gomodule/redigo/redis"
	"net/http"
	"sr"
	"sr/config"
	"strings"
)

var _ = restRouter.HandleFunc("/", handleRoot).Methods("GET")

func handleRoot(response Response, request *Request) {
	logRequest(request)
	http.Redirect(response, request, config.FrontendAddress, http.StatusSeeOther)
	logf(request, ">> 307 %v", config.FrontendAddress)
}

var _ = restRouter.HandleFunc("/robots.txt", handleRobots).Methods("GET")

func handleRobots(response Response, request *Request) {
	logRequest(request)
	// No bots in the API please
	_, err := response.Write([]byte("user-agent: *\ndisallow: *"))
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request, "user-agent: * disallow *")
}

var _ = restRouter.HandleFunc("/coffee", handleCoffee).Methods("GET")

func handleCoffee(response Response, request *Request) {
	logRequest(request)
	http.Error(response, "Soy coffee only", http.StatusTeapot)
	logf(request, ">> 418 Soy coffee only")
}

type healthCheckResponse struct {
	Games    int `json:"games"`
	Sessions int `json:"sessions`
}

var _ = restRouter.HandleFunc("/health-check", handleHealthCheck).Methods("GET")

func handleHealthCheck(response Response, request *Request) {
	logRequest(request)

	conn := sr.RedisPool.Get()
	defer sr.CloseRedis(conn)

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
