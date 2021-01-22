package routes

import (
	"errors"
	"sr/auth"
	"sr/game"
	"sr/player"
	redisUtil "sr/redis"
	"sr/session"
)

var authRouter = restRouter.PathPrefix("/auth").Subrouter()

type loginResponse struct {
	Player   *player.Player `json:"player"`
	GameInfo *game.Info     `json:"game"`
	Session  string         `json:"session"`
}

// POST /auth/login { gameID, playerName } -> auth token, session token
var _ = authRouter.HandleFunc("/login", handleLogin).Methods("POST")

func handleLogin(response Response, request *Request) {
	logRequest(request)
	var login struct {
		GameID   string `json:"gameID"`
		Username string `json:"username"`
		Persist  bool   `json:"persist"`
	}
	err := readBodyJSON(request, &login)
	httpBadRequestIf(response, request, err)

	status := "persist"
	if !login.Persist {
		status = "temp"
	}
	logf(request,
		"Login request: %v to join %v (%v)",
		login.Username, login.GameID, status,
	)

	conn := redisUtil.Connect()
	defer closeRedis(request, conn)

	gameInfo, plr, err := auth.LogPlayerIn(login.GameID, login.Username, conn)
	if err != nil {
		logf(request, "Login response: %v", err)
	}
	if errors.Is(err, player.ErrNotFound) ||
		errors.Is(err, game.ErrNotFound) ||
		errors.Is(err, auth.ErrNotAuthorized) {
		httpForbiddenIf(response, request, err)
	} else if err != nil {
		logf(request, "Error with redis operation: %v", err)
		httpInternalErrorIf(response, request, err)
	}
	logf(request, "Found %v in %v", plr.ID, login.GameID)

	logf(request, "Creating session %s for %v", status, plr.ID)
	session, err := session.New(login.GameID, plr, login.Persist, conn)
	httpInternalErrorIf(response, request, err)
	logf(request, "Created session %v for %v", session.ID, plr.ID)
	logf(request, "Got game info %v", gameInfo)

	err = writeBodyJSON(response, loginResponse{
		Player:   plr,
		GameInfo: gameInfo,
		Session:  string(session.ID),
	})
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request,
		session.Type(), " ", session.ID, " for ", session.PlayerID,
		" in ", login.GameID,
	)
}

// POST /auth/reauth { session } -> { login response }
var _ = authRouter.HandleFunc("/reauth", handleReauth).Methods("POST")

func handleReauth(response Response, request *Request) {
	logRequest(request)
	var reauthRequest struct {
		Session string `json:"session"`
	}
	err := readBodyJSON(request, &reauthRequest)
	httpBadRequestIf(response, request, err)

	requestSession := reauthRequest.Session

	logf(request,
		"Relogin request for session %v", requestSession,
	)

	conn := redisUtil.Connect()
	defer closeRedis(request, conn)

	sess, err := session.GetByID(requestSession, conn)
	httpUnauthorizedIf(response, request, err)
	logf(request, "Found session %s", sess.String())

	// Double check that the relevant items exist.
	gameExists, err := game.Exists(sess.GameID, conn)
	httpInternalErrorIf(response, request, err)
	if !gameExists {
		logf(request, "Game %v does not exist", sess.GameID)
		err = sess.Remove(conn)
		httpInternalErrorIf(response, request, err)
		logf(request,
			"Removed session %v for deleted game %v", sess.ID, sess.GameID,
		)
		httpUnauthorized(response, request, "Your session is now invalid")
	}
	logf(request, "Confirmed game %s exists", sess.GameID)

	plr, err := player.GetByID(string(sess.PlayerID), conn)
	if errors.Is(err, player.ErrNotFound) {
		logf(request, "Player %v does not exist", sess.PlayerID)
		err = sess.Remove(conn)
		httpInternalErrorIf(response, request, err)
		logf(request,
			"Removed session %v for deleted player %v", sess.ID, sess.PlayerID,
		)
		httpUnauthorized(response, request, "Your session is now invalid")
	} else if err != nil {
		httpInternalErrorIf(response, request, err)
	}
	logf(request, "Confirmed player %s exists", plr.ID)

	gameInfo, err := game.GetInfo(sess.GameID, conn)
	httpInternalErrorIf(response, request, err)

	reauthed := loginResponse{
		Player:   plr,
		GameInfo: gameInfo,
		Session:  string(sess.ID),
	}
	err = writeBodyJSON(response, reauthed)
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request,
		sess.PlayerID, " reauthed for ", sess.GameID,
	)
}

// POST auth/logout { session } -> OK

var _ = authRouter.HandleFunc("/logout", handleLogout).Methods("POST")

func handleLogout(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	defer closeRedis(request, conn)
	httpUnauthorizedIf(response, request, err)

	err = sess.Remove(conn)
	httpInternalErrorIf(response, request, err)
	logf(request, "Logged out %v", sess.PlayerInfo())

	httpSuccess(response, request, "logged out")
}
