package routes

import (
	"bytes"
	"encoding/base64"
	netHTTP "net/http"
	"strings"

	"sr/config"
	"sr/errs"
	srHTTP "sr/http"
	"sr/log"
)

func handleRoot(response srHTTP.Response, request srHTTP.Request) {
	ctx := request.Context()
	srHTTP.LogRequest(request, "/")
	response.Header().Set("Content-Type", "text/plain")
	srHTTP.Halt(ctx, errs.NotFoundf("Yep, this is the API."))
}

func handleFrontendRedirect(response srHTTP.Response, request srHTTP.Request) {
	var status int
	if config.FrontendRedirectPermanent {
		status = netHTTP.StatusMovedPermanently
		response.Header().Set("Cache-Control", "max-age=31536000, public, immutable")
	} else {
		status = netHTTP.StatusSeeOther
		response.Header().Add("Cache-Control", "max-age=86400, public")
	}
	netHTTP.Redirect(response, request, config.FrontendOrigin.String(), status)
	srHTTP.LogSuccessf(request.Context(),
		"%v Redirect %v", status, config.FrontendOrigin.String(),
	)
}

var _ = srHTTP.Handle(RESTRouter, "GET /robots.txt", handleRobots)

func handleRobots(args *srHTTP.Args) {
	ctx, response, _, _, _ := args.Get()
	// No bots in the API please
	response.Header().Set("Content-Type", "text/plain")
	response.Header().Set("Cache-Control", "max-age=31536000, public, immutable")
	_, err := response.Write([]byte("user-agent: *\ndisallow: *"))
	srHTTP.HaltInternal(ctx, err)
	srHTTP.LogSuccess(ctx, "user-agent: * disallow: *")
}

var _ = srHTTP.Handle(RESTRouter, "GET /coffee", handleCoffee)

func handleCoffee(args *srHTTP.Args) {
	ctx, response, request, _, _ := args.Get()
	response.Header().Set("Content-Type", "text/plain")
	cacheIndefinitely(request, response)
	netHTTP.Error(response, "Soy coffee only", netHTTP.StatusTeapot)
	log.Printf(ctx, ">> 418 Soy coffee only")
}

type healthCheckResponse struct {
	Games    int `json:"games"`
	Sessions int `json:"fsessions"`
}

var _ = srHTTP.Handle(RESTRouter, "GET /robots.txt", handleRobots)

func handleHealthCheck(args *srHTTP.Args) {
	ctx, response, request, client, _ := args.Get()
	found, err := client.Exists(ctx, "auth_version").Result()
	srHTTP.HaltInternal(ctx, err)
	if found != 1 {
		srHTTP.Halt(ctx, errs.Internalf("Server is not healthy!"))
	}

	// Check if we're just saying ok
	if config.IsProduction && len(config.HealthCheckSecretKey) == 0 {
		srHTTP.LogSuccess(ctx, "OK (skip extra info)")
		return
	}

	// Get creds (auth only checked in production)
	if config.IsProduction {
		auth := request.Header.Get("Authentication")
		if !strings.HasPrefix(auth, "Bearer ") {
			srHTTP.LogSuccess(ctx, "OK (missing auth for extra info)")
			return
		}
		key, err := base64.StdEncoding.DecodeString(auth[8:])
		if err != nil {
			log.Printf(ctx, "Error decoding auth key: %v", err)
			srHTTP.LogSuccess(ctx, "OK (error decoding key)")
			return
		}
		if !bytes.Equal(key, config.HealthCheckSecretKey) {
			srHTTP.LogSuccess(ctx, "OK (attempted to auth with bad key)")
			return
		}
	}

	// Okay, send them stuff
	games, err := client.Keys(ctx, "game:*").Result()
	srHTTP.HaltInternal(ctx, err)

	sessions, err := client.Keys(ctx, "session:*").Result()
	srHTTP.HaltInternal(ctx, err)

	resp := healthCheckResponse{
		Games:    len(games),
		Sessions: len(sessions),
	}
	srHTTP.MustWriteBodyJSON(ctx, response, &resp)
	srHTTP.LogSuccessf(ctx, "%v games, %v sessions", resp.Games, resp.Sessions)
}
