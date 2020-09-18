package routes

import (
	"sr"
)

var authRouter = restRouter.PathPrefix("/auth").Subrouter()

type loginResponse struct {
	PlayerID   string      `json:"playerID"`
	PlayerName string      `json:"playerName"`
	GameInfo   sr.GameInfo `json:"game"`
	Session    string      `json:"session"`
	LastEvent  string      `json:"lastEvent"`
}

// POST /auth/login { gameID, playerName } -> auth token, session token
var _ = authRouter.HandleFunc("/login", handleLogin).Methods("POST")

func handleLogin(response Response, request *Request) {
	logRequest(request)
	var loginRequest struct {
		GameID     string `json:"gameID"`
		PlayerName string `json:"playerName"`
		Persist    bool   `json:"persist"`
	}
	err := readBodyJSON(request, &loginRequest)
	httpBadRequestIf(response, request, err)

	playerName := loginRequest.PlayerName
	gameID := loginRequest.GameID
	persist := loginRequest.Persist
	logf(request,
		"Login request: %v joining %v (persist: %v)",
		playerName, gameID, persist,
	)

	conn := sr.RedisPool.Get()
	defer sr.CloseRedis(conn)

	// Check for permission to join (if game ID exists)
	gameExists, err := sr.GameExists(gameID, conn)
	httpInternalErrorIf(response, request, err)
	if !gameExists {
		httpNotFound(response, request, "Game not found")
	}

	// Create player
	session, err := sr.NewPlayerSession(gameID, playerName, persist, conn)
	httpInternalErrorIf(response, request, err)

	eventID, err := sr.AddNewPlayerToKnownGame(&session, conn)
	httpInternalErrorIf(response, request, err)

	logf(request, "Authenticated: %s", session.LogInfo())

	// Get game info
	gameInfo, err := sr.GetGameInfo(session.GameID, conn)
	httpInternalErrorIf(response, request, err)

	// Response
	loggedIn := loginResponse{
		PlayerID:   string(session.PlayerID),
		PlayerName: session.PlayerName,
		GameInfo:   gameInfo,
		Session:    string(session.ID),
		LastEvent:  eventID,
	}
	err = writeBodyJSON(response, loggedIn)
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request,
		session.Type(), " ", session.ID, " for ", session.PlayerID, " in ", gameID,
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
		"Relogin request for %v", requestSession,
	)

	conn := sr.RedisPool.Get()
	defer sr.CloseRedis(conn)

	session, err := sr.GetSessionByID(requestSession, conn)
	httpUnauthorizedIf(response, request, err)

	gameExists, err := sr.GameExists(session.GameID, conn)
	httpInternalErrorIf(response, request, err)
	if !gameExists {
		logf(request, "Game %v does not exist", session.GameID)
		err = sr.RemoveSession(&session, conn)
		httpInternalErrorIf(response, request, err)
		logf(request, "Removed session for deleted game %v", session.GameID)
		httpUnauthorized(response, request, "Your session is now invalid")
	}

	// We skip showing a "player has joined" message here.

	logf(request, "Confirmed %s", session.LogInfo())

	gameInfo, err := sr.GetGameInfo(session.GameID, conn)
	httpInternalErrorIf(response, request, err)

	reauthed := loginResponse{
		PlayerID:   string(session.PlayerID),
		PlayerName: session.PlayerName,
		GameInfo:   gameInfo,
		Session:    string(session.ID),
		LastEvent:  "",
	}
	err = writeBodyJSON(response, reauthed)
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request,
		session.PlayerID, " reauthed for ", session.GameID,
	)
}

// POST auth/logout { session } -> OK

var _ = authRouter.HandleFunc("/logout", handleLogout).Methods("POST")

func handleLogout(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	httpUnauthorizedIf(response, request, err)
	defer sr.CloseRedis(conn)

	err = sr.RemoveSession(&sess, conn)
	httpInternalErrorIf(response, request, err)
	logf(request, "Logged out %v", sess.LogInfo())

	httpSuccess(response, request, "logged out")
}
