package routes

import (
    "github.com/gomodule/redigo/redis"
    "sr"
    "github.com/gorilla/mux"
)

var taskRouter = mux.NewRouter()

func init() {
    taskRouter.Use(localhostOnlyMiddleware)
}

var _ = taskRouter.HandleFunc("/trimPlayers", handleTrimPlayers)

func handleTrimPlayers(response Response, request *Request) {
    logRequest(request)
    _, conn, err := requestSession(request)
    httpUnauthorizedIf(response, request, err)
    defer sr.CloseRedis(conn)

    gameID := request.URL.Query().Get("gameID")
    if gameID == "" {
        httpBadRequest(response, request, "No game ID given")
    }
    logf(request, "Trimming players in %v", gameID)
    exists, err := sr.GameExists(gameID, conn)
    httpInternalErrorIf(response, request, err)
    if !exists {
        httpBadRequest(response, request, "No game '"+gameID+"' found")
    }

    sessionKeys, err := redis.Strings(conn.Do("keys", "session:*"))
    httpInternalErrorIf(response, request, err)
    logf(request, "Found %v sessions", len(sessionKeys))
    if len(sessionKeys) == 0 {
        httpInternalError(response, request, "There are no sessions")
    }
    err = conn.Send("MULTI")
    httpInternalErrorIf(response, request, err)

    // var foundPlayers map[string]bool

    for _, key := range(sessionKeys) {
        sessionID := key[8:]
        logf(request, "Checking for session %v in %v", sessionID, gameID)
        sess, err := sr.GetSessionByID(sessionID, conn)
        logf(request, "Found %v", sess.LogInfo())
        httpInternalErrorIf(response, request, err)
    }
}
