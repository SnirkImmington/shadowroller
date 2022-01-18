package routes

import (
	"errors"
	"time"

	"shadowroller.net/libsr/config"
	"shadowroller.net/libsr/errs"
	"sr/game"
	srHTTP "shadowroller.net/libsr/http"
	"sr/id"
	"sr/log"
	"sr/player"

	"github.com/go-redis/redis/v8"
)

// RegisterTasksViaConfig adds the /task route if it's enabled.
// It must be called after config values are loaded.
func RegisterTasksViaConfig() {
	if config.EnableTasks {
		RESTRouter.PathPrefix("/task").Handler(tasksRouter)
	}
	if config.TasksLocalhostOnly {
		tasksRouter.Use(srHTTP.LocalhostOnlyMiddleware)
	}
}

var tasksRouter = makeTasksRouter()

var _ = tasksRouter.HandleFunc("/clear-all-sessions", srHTTP.Wrap(handleClearSessions)).Methods("GET")

func handleClearSessions(response srHTTP.Response, request srHTTP.Request, client *redis.Client) {
	ctx := request.Context()
	keys, err := client.Keys(ctx, "session:*").Result()
	srHTTP.HaltInternal(ctx, err)

	deleted, err := client.Del(ctx, keys...).Result()
	srHTTP.HaltInternal(ctx, err)

	if deleted != int64(len(keys)) {
		srHTTP.Halt(ctx, errs.Internalf("expected %v results, got %v", len(keys), deleted))
	}
	srHTTP.LogSuccessf(ctx, "Deleted %v sessions", deleted)
}

var _ = tasksRouter.HandleFunc("/timeout-all-sessions", srHTTP.Wrap(handleTimeoutAllSessions)).Methods("GET")

func handleTimeoutAllSessions(response srHTTP.Response, request srHTTP.Request, client *redis.Client) {
	ctx := request.Context()
	durString := request.FormValue("dur")
	if durString == "" {
		srHTTP.Halt(ctx, errs.BadRequestf("Must specify dur"))
	}

	dur, err := time.ParseDuration(durString)
	if err != nil {
		srHTTP.Halt(ctx, errs.BadRequestf("Error parsing duration: %v", err))
	}

	keys, err := client.Keys(ctx, "session:*").Result()
	srHTTP.HaltInternal(ctx, err)

	results, err := client.Pipelined(ctx, func(pipe redis.Pipeliner) error {
		for _, key := range keys {
			pipe.Expire(ctx, key, dur)
		}
		return nil
	})
	srHTTP.HaltInternal(ctx, err)

	if len(results) != len(keys) {
		srHTTP.Halt(ctx, errs.Internalf("expected %v results, got %v", len(keys), results))
	}
	srHTTP.LogSuccessf(ctx, "Deleted %v sessions", len(results))
}

var _ = tasksRouter.HandleFunc("/create-game", srHTTP.Wrap(handleCreateGame)).Methods("GET")

func handleCreateGame(response srHTTP.Response, request srHTTP.Request, client *redis.Client) {
	ctx := request.Context()
	gameID := request.FormValue("gameID")
	if gameID == "" {
		srHTTP.Halt(ctx, errs.BadRequestf("Invalid game ID"))
	}

	if exists, err := game.Exists(ctx, client, gameID); exists || err != nil {
		srHTTP.HaltInternal(ctx, err) // If there's a redis error, internal first
		srHTTP.Halt(ctx, errs.BadRequestf("Game already exists"))
	}

	set, err := client.HSet(ctx, "game:"+gameID, "created_at", id.TimestampNow()).Result()
	srHTTP.HaltInternal(ctx, err)
	if set != 1 {
		srHTTP.Halt(ctx,
			errs.Internalf("expected 1 new field to be updated, got %v", set),
		)
	}
	srHTTP.LogSuccessf(ctx, "Game %v created", gameID)
}

var _ = tasksRouter.HandleFunc("/delete-game", srHTTP.Wrap(handleDeleteGame)).Methods("GET")

func handleDeleteGame(response srHTTP.Response, request srHTTP.Request, client *redis.Client) {
	ctx := request.Context()
	gameID := request.FormValue("gameID")
	if gameID == "" {
		srHTTP.Halt(ctx, errs.BadRequestf("Invalid game ID"))
	}

	if exists, err := game.Exists(ctx, client, gameID); !exists || err != nil {
		srHTTP.HaltInternal(ctx, err) // Halt for redis error first
		srHTTP.Halt(ctx, errs.BadRequestf("Game does not exist"))
	}

	results, err := client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		pipe.Del(ctx, "game:"+gameID)
		pipe.Del(ctx, "players:"+gameID)
		return nil
	})
	srHTTP.HaltInternal(ctx, err)
	if len(results) != 2 {
		srHTTP.Halt(ctx, errs.Internalf("expected 2 keys deleted, got %v", results))
	}
	srHTTP.LogSuccessf(ctx, "Game %v deleted", gameID)
}

var _ = tasksRouter.HandleFunc("/create-player", srHTTP.Wrap(handleCreatePlayer)).Methods("GET")

func handleCreatePlayer(response srHTTP.Response, request srHTTP.Request, client *redis.Client) {
	ctx := request.Context()
	username := request.FormValue("uname")
	if username == "" {
		srHTTP.Halt(ctx, errs.BadRequestf("Username `uname` not specified"))
	}
	name := request.FormValue("name")
	if name == "" {
		srHTTP.Halt(ctx, errs.BadRequestf("Name `name` not specified"))
	}

	plr := player.Make(username, name)
	log.Printf(ctx, "Created %#v", plr)

	err := player.Create(ctx, client, &plr)
	if errors.Is(err, errs.ErrBadRequest) {
		srHTTP.Halt(ctx, errs.BadRequestf("A player with that username already exists"))
	}
	srHTTP.HaltInternal(ctx, err)
	srHTTP.LogSuccessf(ctx, "Player %v created with ID %v", plr.Username, plr.ID)
}

var _ = tasksRouter.HandleFunc("/add-to-game", srHTTP.Wrap(handleAddToGame)).Methods("GET")

func handleAddToGame(response srHTTP.Response, request srHTTP.Request, client *redis.Client) {
	ctx := request.Context()
	username := request.FormValue("uname")
	if username == "" {
		srHTTP.Halt(ctx, errs.BadRequestf("Username `uname` not specified"))
	}
	gameID := request.FormValue("game")
	if gameID == "" {
		srHTTP.Halt(ctx, errs.BadRequestf("GameID `game` not specified"))
	}

	plr, err := player.GetByUsername(ctx, client, username)
	if errors.Is(err, errs.ErrNotFound) {
		srHTTP.Halt(ctx, errs.BadRequestf("Player with username %v not found", username))
	}
	srHTTP.HaltInternal(ctx, err)
	log.Printf(ctx, "Found %#v", plr)

	err = game.AddPlayer(ctx, client, gameID, plr)
	srHTTP.HaltInternal(ctx, err)
	srHTTP.LogSuccessf(ctx, "Added %v to %v", plr, gameID)
}

/*
var _ = tasksRouter.HandleFunc("/trim-players", srHTTP.Wrap(handleTrimPlayers)).Methods("GET")

func handleTrimPlayers(response srHTTP.Response, request srHTTP.Request, client *redis.Client) {
	gameID := request.URL.Query().Get("gameID")
	if gameID == "" {
		srHTTP.Halt(ctx, errs.BadRequest("No game ID given")
	}
	log.Printf(ctx, "Trimming players in %v", gameID)
	exists, err := game.Exists(gameID, conn)
	srHTTP.HaltInternal(ctx, err)
	if !exists {
		srHTTP.Halt(ctx, errs.BadRequest("No game '"+gameID+"' found")
	}

	sessionKeys, err := redis.Strings(conn.Do("keys", "session:*"))
	srHTTP.HaltInternal(ctx, err)
	log.Printf(ctx, "Found %v sessions", len(sessionKeys))
	if len(sessionKeys) == 0 {
		srHTTP.Halt(ctx, errs.Internalf("There are no sessions")
	}
	err = conn.Send("MULTI")
	srHTTP.HaltInternal(ctx, err)

	// var foundPlayers map[string]bool

	for _, key := range sessionKeys {
		sessionID := key[8:]
		log.Printf(ctx, "Checking for session %v in %v", sessionID, gameID)
		sess, err := session.GetByID(sessionID, conn)
		log.Printf(ctx, "Found %v", sess)
		srHTTP.HaltInternal(ctx, err)
	}
}
*/
