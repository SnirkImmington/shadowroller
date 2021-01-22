package routes

import (
	"errors"
	"github.com/gomodule/redigo/redis"
	redisUtil "sr/redis"
	"sr/session"
	"strings"
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

// requestSession retrieves the authenticated session for the request.
// It does not open redis if an invalid session is supplied.
func requestSession(request *Request) (*session.Session, redis.Conn, error) {
	sessionID, err := sessionFromHeader(request)
	if err != nil {
		logf(request, "Didn't have a session ID")
		return nil, nil, err
	}
	conn := redisUtil.Connect()
	session, err := session.GetByID(sessionID, conn)
	if err != nil {
		logf(request, "Didn't get %s by id", sessionID)
		redisUtil.Close(conn)
		return nil, nil, err
	}
	return session, conn, nil
}

func requestParamSession(request *Request) (*session.Session, redis.Conn, error) {
	sessionID, err := sessionFromParams(request)
	if err != nil {
		return nil, nil, err
	}
	conn := redisUtil.Connect()
	session, err := session.GetByID(sessionID, conn)
	if err != nil {
		redisUtil.Close(conn)
		return nil, nil, err
	}
	return session, conn, nil
}
