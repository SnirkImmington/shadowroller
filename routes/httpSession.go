package routes

import (
	"errors"
	"github.com/gomodule/redigo/redis"
	"sr"
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
func requestSession(request *Request) (sr.Session, redis.Conn, error) {
	sessionID, err := sessionFromHeader(request)
	if err != nil {
        logf(request, "Didn't have a session ID")
		return sr.Session{}, nil, err
	}
	conn := sr.RedisPool.Get()
	session, err := sr.GetSessionByID(sessionID, conn)
	if err != nil {
		logf(request, "Didn't get %s by id", sessionID)
		conn.Close()
		return sr.Session{}, nil, err
	}
	return session, conn, nil
}

func requestParamSession(request *Request) (sr.Session, redis.Conn, error) {
    sessionID, err := sessionFromParams(request)
    if err != nil {
        return sr.Session{}, nil, err
    }
    conn := sr.RedisPool.Get()
	session, err := sr.GetSessionByID(sessionID, conn)
	if err != nil {
		conn.Close()
		return sr.Session{}, nil, err
	}
	return session, conn, nil
}
