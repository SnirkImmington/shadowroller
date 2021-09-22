package routes

import (
	"errors"

	"sr/auth"
	"sr/game"
	"sr/player"
	"sr/session"

	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/semconv/v1.4.0"

	"github.com/go-redis/redis/v8"
)

var authRouter = restRouter.PathPrefix("/auth").Subrouter()

type loginRequest struct {
	GameID   string `json:"gameID"`
	Username string `json:"username"`
	Persist  bool   `json:"persist"`
}

type loginResponse struct {
	Player   *player.Player `json:"player"`
	GameInfo *game.Info     `json:"game"`
	Session  string         `json:"session"`
}

// POST /auth/login { gameID, playerName } -> auth token, session token
var _ = authRouter.HandleFunc("/login", Wrap2(handleLogin)).Methods("POST")

func handleLogin(args *Args) {
	ctx, response, request, client, _ := args.Get()
	var login loginRequest
	err := readBodyJSON(request, &login)
	httpBadRequestIf(response, request, err)

	status := "persist"
	if !login.Persist {
		status = "temp"
	}
	logEvent(ctx, "Got login",
		attr.String("request.gameID", login.GameID),
		attr.String("request.type", status),
	)

	gameInfo, plr, err := auth.LogPlayerIn(ctx, client, login.GameID, login.Username)
	if err != nil {
		logf2(ctx, "Login response: %v", err)
	}
	if errors.Is(err, player.ErrNotFound) ||
		errors.Is(err, game.ErrNotFound) ||
		errors.Is(err, auth.ErrNotAuthorized) {
		httpForbiddenIf(response, request, err)
	}
	httpInternalErrorIf(response, request, err)
	logf(request, "Found %v in %v", plr.ID, login.GameID)
	logEvent(ctx, "Found player",
		semconv.EnduserIDKey.String(plr.ID.String()),
	)

	logf(request, "Creating session %s for %v", status, plr.ID)
	sess := session.New(plr, login.GameID, login.Persist)
	err = session.Create(ctx, client, sess)
	httpInternalErrorIf(response, request, err)
	logEvent(ctx, "Created session",
		attr.String("response.session", sess.ID.String()),
	)

	err = writeBodyJSON(response, loginResponse{
		Player:   plr,
		GameInfo: gameInfo,
		Session:  string(sess.ID),
	})
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request,
		sess.Type(), " ", sess.ID, " for ", sess.PlayerID, " in ", login.GameID,
	)
}

type reauthRequest struct {
	Session string `json:"session"`
}

// POST /auth/reauth { session } -> { login response }
var _ = authRouter.HandleFunc("/reauth", Wrap(handleReauth)).Methods("POST")

func handleReauth(response Response, request *Request, client *redis.Client) {
	var reauth reauthRequest
	err := readBodyJSON(request, &reauth)
	httpBadRequestIf(response, request, err)
	reauthSession := reauth.Session

	logf(request,
		"Reauth request for session %v", reauthSession,
	)
	ctx := request.Context()
	sess, err := session.GetByID(ctx, client, reauthSession)
	httpUnauthorizedIf(response, request, err)
	logf(request, "Found session %v", sess.String())

	// Double check that the relevant items exist.
	gameExists, err := game.Exists(ctx, client, sess.GameID)
	httpInternalErrorIf(response, request, err)
	if !gameExists {
		logf2(ctx, "Game %v does not exist", sess.GameID)
		err = session.Remove(ctx, client, sess)
		httpInternalErrorIf(response, request, err)
		logf2(ctx,
			"Removed session %v for deleted game %v", sess.ID, sess.GameID,
		)
		httpUnauthorized(response, request, "Your session is now invalid")
	}
	logf(request, "Confirmed game %v exists", sess.GameID)

	plr, err := player.GetByID(ctx, client, string(sess.PlayerID))
	if errors.Is(err, player.ErrNotFound) {
		logf2(ctx, "Player does not exist")
		err = session.Remove(ctx, client, sess)
		httpInternalErrorIf(response, request, err)
		logf(request,
			"Removed session %v for deleted player %v", sess.ID, sess.PlayerID,
		)
		httpUnauthorized(response, request, "Your session is now invalid")
	} else if err != nil {
		httpInternalErrorIf(response, request, err)
	}
	logf(request, "Confirmed player %s exists", plr.ID)

	gameInfo, err := game.GetInfo(ctx, client, sess.GameID)
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

var _ = authRouter.HandleFunc("/logout", Wrap(handleLogout)).Methods("POST")

func handleLogout(response Response, request *Request, client *redis.Client) {
	sess, ctx, err := requestSession(request, client)
	httpUnauthorizedIf(response, request, err)

	err = session.Remove(ctx, client, sess)
	httpInternalErrorIf(response, request, err)
	logf(request, "Logged out %v", sess.PlayerInfo())

	httpSuccess(response, request, "logged out")
}
