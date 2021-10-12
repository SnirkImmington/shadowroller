package routes

import (
	"errors"

	"sr/auth"
	"sr/errs"
	"sr/game"
	srHTTP "sr/http"
	"sr/log"
	"sr/player"
	"sr/session"

	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/semconv/v1.4.0"
)

var authRouter = RESTRouter.PathPrefix("/auth").Subrouter()

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
var _ = srHTTP.Handle(authRouter, "POST /login", handleLogin)

func handleLogin(args *srHTTP.Args) {
	ctx, response, request, client, _ := args.Get()
	var login loginRequest
	srHTTP.MustReadBodyJSON(request, &login)

	status := "persist"
	if !login.Persist {
		status = "temp"
	}
	log.Event(ctx, "Login request",
		attr.String("sr.login.requestGameID", login.GameID),
		attr.String("sr.login.requestType", status),
	)

	gameInfo, plr, err := auth.LogPlayerIn(ctx, client, login.GameID, login.Username)
	if err != nil {
		log.Printf(ctx, "Login error: %v", err)
	}
	if errors.Is(err, player.ErrNotFound) ||
		errors.Is(err, game.ErrNotFound) ||
		errors.Is(err, auth.ErrNotAuthorized) {
		srHTTP.Halt(ctx, errs.NoAccess(err))
	}
	srHTTP.HaltInternal(ctx, err)
	log.Printf(ctx, "Found %v in %v", plr.ID, login.GameID)

	log.Printf(ctx, "Creating session %s for %v", status, plr.ID)
	sess := session.New(plr, login.GameID, login.Persist)
	err = session.Create(ctx, client, sess)
	srHTTP.HaltInternal(ctx, err)

	srHTTP.MustWriteBodyJSON(ctx, response, loginResponse{
		Player:   plr,
		GameInfo: gameInfo,
		Session:  string(sess.ID),
	})

	log.Event(ctx, "Player login",
		semconv.EnduserIDKey.String(sess.PlayerID.String()),
		attr.String("sr.login.sessionID", sess.ID.String()),
		attr.String("sr.login.sessionType", sess.Type()),
	)

	srHTTP.LogSuccessf(ctx, "%v %v for %v in %v",
		sess.Type(), sess.ID,
		sess.PlayerID, login.GameID,
	)
}

type reauthRequest struct {
	Session string `json:"session"`
}

// POST /auth/reauth { session } -> { login response }
var _ = srHTTP.Handle(authRouter, "POST /reauth", handleReauth)

func handleReauth(args *srHTTP.Args) {
	ctx, response, request, client, _ := args.Get()
	var reauth reauthRequest
	srHTTP.MustReadBodyJSON(request, &reauth)
	reauthSession := reauth.Session

	log.Printf(ctx,
		"Reauth request for session %v", reauthSession,
	)
	sess, err := session.GetByID(ctx, client, reauthSession)
	srHTTP.Halt(ctx, errs.NoAccess(err))
	log.Printf(ctx, "Found session %v", sess.String())

	// Double check that the relevant items exist.
	gameExists, err := game.Exists(ctx, client, sess.GameID)
	srHTTP.HaltInternal(ctx, err)
	if !gameExists {
		log.Printf(ctx, "Game %v does not exist", sess.GameID)
		err = session.Remove(ctx, client, sess)
		srHTTP.HaltInternal(ctx, err)
		log.Printf(ctx,
			"Removed session %v for deleted game %v", sess.ID, sess.GameID,
		)
		srHTTP.Halt(ctx, errs.NoAccessf("Your session is invalid"))
	}
	log.Printf(ctx, "Confirmed game %v exists", sess.GameID)

	plr, err := player.GetByID(ctx, client, string(sess.PlayerID))
	if errors.Is(err, player.ErrNotFound) {
		log.Printf(ctx, "Player does not exist")
		err = session.Remove(ctx, client, sess)
		srHTTP.HaltInternal(ctx, err)
		log.Printf(ctx,
			"Removed session %v for deleted player %v", sess.ID, sess.PlayerID,
		)
		srHTTP.Halt(ctx, errs.NoAccessf("Your session is invalid"))
	} else if err != nil {
		srHTTP.HaltInternal(ctx, err)
	}
	log.Printf(ctx, "Confirmed player %s exists", plr.ID)

	gameInfo, err := game.GetInfo(ctx, client, sess.GameID)
	srHTTP.HaltInternal(ctx, err)

	srHTTP.MustWriteBodyJSON(ctx, response, loginResponse{
		Player:   plr,
		GameInfo: gameInfo,
		Session:  string(sess.ID),
	})

	log.Event(ctx, "Player reauth",
		semconv.EnduserIDKey.String(sess.PlayerID.String()),
		attr.String("sr.login.sessionID", sess.ID.String()),
		attr.String("sr.login.sessionType", sess.Type()),
	)

	srHTTP.LogSuccessf(ctx, "%v reauthed for %v",
		sess.PlayerID, sess.GameID,
	)
}

// POST auth/logout { session } -> OK

var _ = srHTTP.Handle(authRouter, "POST /logout", handleLogout)

func handleLogout(args *srHTTP.Args) {
	ctx, _, _, client, sess := args.MustSession()

	err := session.Remove(ctx, client, sess)
	srHTTP.HaltInternal(ctx, err)

	log.Event(ctx, "Player logout",
		semconv.EnduserIDKey.String(sess.PlayerID.String()),
		attr.String("sr.login.sessionID", sess.ID.String()),
	)

	srHTTP.LogSuccessf(ctx, "Logged out %v", sess.PlayerID)
}
