package routes

import (
	"errors"
	"fmt"
	"time"

	"sr/config"
	"sr/game"
	"sr/id"
	"sr/player"

	"github.com/go-redis/redis/v8"
)

// RegisterTasksViaConfig adds the /task route if it's enabled.
// It must be called after config values are loaded.
func RegisterTasksViaConfig() {
	if config.EnableTasks {
		restRouter.PathPrefix("/task").Handler(tasksRouter)
	}
	if config.TasksLocalhostOnly {
		tasksRouter.Use(localhostOnlyMiddleware)
	}
}

var tasksRouter = makeTasksRouter()

var _ = tasksRouter.HandleFunc("/clear-all-sessions", Wrap(handleClearSessions)).Methods("GET")

func handleClearSessions(response Response, request *Request, client *redis.Client) {
	ctx := request.Context()
	keys, err := client.Keys(ctx, "session:*").Result()
	httpInternalErrorIf(response, request, err)

	deleted, err := client.Del(ctx, keys...).Result()
	httpInternalErrorIf(response, request, err)

	if deleted != int64(len(keys)) {
		logf(request, "Expected %v results, got %v", len(keys), deleted)
		httpInternalError(response, request, "Invalid response from redis")
	}
	httpSuccess(response, request,
		"Deleted ", deleted, " sessions",
	)
}

var _ = tasksRouter.HandleFunc("/timeout-all-sessions", Wrap(handleTimeoutAllSessions)).Methods("GET")

func handleTimeoutAllSessions(response Response, request *Request, client *redis.Client) {
	ctx := request.Context()
	durString := request.FormValue("dur")
	if durString == "" {
		httpBadRequest(response, request, "Must specify dur")
	}

	dur, err := time.ParseDuration(durString)
	if err != nil {
		msg := fmt.Sprintf("Error parsing duration: %v", err)
		httpBadRequest(response, request, msg)
	}

	keys, err := client.Keys(ctx, "session:*").Result()
	httpInternalErrorIf(response, request, err)

	results, err := client.Pipelined(ctx, func(pipe redis.Pipeliner) error {
		for _, key := range keys {
			pipe.Expire(ctx, key, dur)
		}
		return nil
	})
	httpInternalErrorIf(response, request, err)

	if len(results) != len(keys) {
		logf(request, "Expected %v results, got %v", len(keys), results)
		httpInternalError(response, request, "Invalid response from redis")
	}
	httpSuccess(response, request,
		"Deleted ", len(results), " sessions",
	)
}

var _ = tasksRouter.HandleFunc("/create-game", Wrap(handleCreateGame)).Methods("GET")

func handleCreateGame(response Response, request *Request, client *redis.Client) {
	gameID := request.FormValue("gameID")
	if gameID == "" {
		httpBadRequest(response, request, "Invalid game ID")
	}

	ctx := request.Context()
	if exists, err := game.Exists(ctx, client, gameID); exists || err != nil {
		httpInternalErrorIf(response, request, err)
		httpBadRequest(response, request, "Game already exists")
	}

	set, err := client.HSet(ctx, "game:"+gameID, "created_at", id.TimestampNow()).Result()
	httpInternalErrorIf(response, request, err)
	if set != 1 {
		httpInternalError(response, request,
			fmt.Sprintf("Expected 1 new field to be updated, got %v", set),
		)
	}
	httpSuccess(response, request,
		"Game ", gameID, " created",
	)
}

var _ = tasksRouter.HandleFunc("/delete-game", Wrap(handleDeleteGame)).Methods("GET")

func handleDeleteGame(response Response, request *Request, client *redis.Client) {
	gameID := request.FormValue("gameID")
	if gameID == "" {
		httpBadRequest(response, request, "Invalid game ID")
	}

	ctx := request.Context()
	if exists, err := game.Exists(ctx, client, gameID); !exists || err != nil {
		httpInternalErrorIf(response, request, err)
		httpBadRequest(response, request, "Game does not exist")
	}

	results, err := client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		pipe.Del(ctx, "game:"+gameID)
		pipe.Del(ctx, "players:"+gameID)
		return nil
	})
	httpInternalErrorIf(response, request, err)
	if len(results) != 2 {
		httpInternalError(response, request,
			fmt.Sprintf("expected 2 keys to be deleted, got %v", results),
		)
	}
	httpSuccess(response, request,
		"Game ", gameID, " deleted",
	)
}

var _ = tasksRouter.HandleFunc("/create-player", Wrap(handleCreatePlayer)).Methods("GET")

func handleCreatePlayer(response Response, request *Request, client *redis.Client) {
	ctx := request.Context()
	username := request.FormValue("uname")
	if username == "" {
		httpBadRequest(response, request, "Username `uname` not specified")
	}
	name := request.FormValue("name")
	if name == "" {
		httpBadRequest(response, request, "Name `name` not specified")
	}

	plr := player.Make(username, name)
	logf(request, "Created %#v", plr)

	err := player.Create(ctx, client, &plr)
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request,
		"Player ", plr.Username, " created with ID ", plr.ID,
	)
}

var _ = tasksRouter.HandleFunc("/add-to-game", Wrap(handleAddToGame)).Methods("GET")

func handleAddToGame(response Response, request *Request, client *redis.Client) {
	username := request.FormValue("uname")
	if username == "" {
		httpBadRequest(response, request, "Username `uname` not specified")
	}
	gameID := request.FormValue("game")
	if gameID == "" {
		httpBadRequest(response, request, "GameID `game` not specified")
	}

	ctx := request.Context()
	plr, err := player.GetByUsername(ctx, client, username)
	if errors.Is(err, player.ErrNotFound) {
		httpBadRequest(response, request,
			fmt.Sprintf("Player with username %v not found", username),
		)
	}
	httpInternalErrorIf(response, request, err)
	logf(request, "Found %#v", plr)

	err = game.AddPlayer(ctx, client, gameID, plr)
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request,
		"Added ", plr, " to ", gameID,
	)
}

/*
var _ = tasksRouter.HandleFunc("/trim-players", Wrap(handleTrimPlayers)).Methods("GET")

func handleTrimPlayers(response Response, request *Request, client *redis.Client) {
	gameID := request.URL.Query().Get("gameID")
	if gameID == "" {
		httpBadRequest(response, request, "No game ID given")
	}
	logf(request, "Trimming players in %v", gameID)
	exists, err := game.Exists(gameID, conn)
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

	for _, key := range sessionKeys {
		sessionID := key[8:]
		logf(request, "Checking for session %v in %v", sessionID, gameID)
		sess, err := session.GetByID(sessionID, conn)
		logf(request, "Found %v", sess)
		httpInternalErrorIf(response, request, err)
	}
}
*/
