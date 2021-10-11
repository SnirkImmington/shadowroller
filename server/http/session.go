package http

import (
	"strings"

	"sr/errs"
	"sr/log"
	"sr/session"

	"github.com/go-redis/redis/v8"
)

var errNoAuthBearer = errs.BadRequestf("no auth bearer header")
var errNoSessionParam = errs.BadRequestf("no session query param")

func SessionFromHeader(request Request) (string, error) {
	auth := request.Header.Get("Authentication")
	if !strings.HasPrefix(auth, "Bearer") {
		return "", errNoAuthBearer
	}
	return auth[7:], nil
}

func SessionFromParams(request Request) (string, error) {
	session := request.URL.Query().Get("session")
	if session == "" || session == "null" || session == "undefined" {
		return "", errNoSessionParam
	}
	return session, nil
}

func RequestSession(request Request, client redis.Cmdable) (*session.Session, error) {
	sessionID, err := SessionFromHeader(request)
	ctx := request.Context()
	if err != nil {
		log.Printf(ctx, "Didn't have a session ID")
		return nil, err
	}
	sess, err := session.GetByID(ctx, client, sessionID)
	if err != nil {
		log.Printf(ctx, "Didn't get %s by id", sessionID)
		return nil, err
	}
	return sess, nil
}

func RequestParamSession(request Request, client redis.Cmdable) (*session.Session, error) {
	sessionID, err := SessionFromParams(request)
	ctx := request.Context()
	if err != nil {
		log.Printf(ctx, "Didn't have session ID")
		return nil, err
	}
	sess, err := session.GetByID(ctx, client, sessionID)
	if err != nil {
		log.Printf(ctx, "Didn't get %v by ID", sessionID)
		return nil, err
	}
	return sess, nil
}
