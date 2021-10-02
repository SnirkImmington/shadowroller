package routes

import (
	"context"
	"errors"
	"sr/session"
	"strings"

	"github.com/go-redis/redis/v8"
	attr "go.opentelemetry.io/otel/attribute"
)

var errNoAuthBearer = errors.New("httpSession: no auth: bearer header")
var errNoSessionParam = errors.New("httpSession: no session query param")

func sessionFromHeader(request *Request) (string, error) {
	auth := request.Header.Get("Authentication")
	if !strings.HasPrefix(auth, "Bearer") {
		return "", errNoAuthBearer
	}
	return auth[7:], nil
}

func sessionFromParams(request *Request) (string, error) {
	session := request.URL.Query().Get("session")
	if session == "" || session == "null" || session == "undefined" {
		return "", errNoSessionParam
	}
	return session, nil
}

func requestSession2(request *Request, client redis.Cmdable) (*session.Session, error) {
	ctx := request.Context()
	sessionID, err := sessionFromHeader(request)
	if err != nil {
		logEvent(ctx, "Didn't have a session ID")
		return nil, err
	}
	sess, err := session.GetByID(ctx, client, sessionID)
	if err != nil {
		logf2(ctx, "Couldn't find session %v", sessionID)
		return nil, err
	}
	return sess, nil
}

// requestSession retrieves the authenticated session for the request.
func requestSession(request *Request, client redis.Cmdable) (*session.Session, context.Context, error) {
	sessionID, err := sessionFromHeader(request)
	if err != nil {
		logf(request, "Didn't have a session ID")
		return nil, nil, err
	}
	ctx := request.Context()
	sess, err := session.GetByID(ctx, client, sessionID)
	if err != nil {
		logf(request, "Didn't get %s by id", sessionID)
		return nil, nil, err
	}
	return sess, ctx, nil
}

func requestParamSession(request *Request, client redis.Cmdable) (*session.Session, context.Context, error) {
	sessionID, err := sessionFromParams(request)
	if err != nil {
		return nil, nil, err
	}
	ctx := request.Context()
	sess, err := session.GetByID(ctx, client, sessionID)
	if err != nil {
		return nil, nil, err
	}
	return sess, ctx, nil
}
