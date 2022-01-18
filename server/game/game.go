package game

import (
	"context"
	"errors"

	"shadowroller.net/libsr/errs"
	"sr/id"
	srOtel "shadowroller.net/libsr/otel"
	"sr/player"
	redisUtil "shadowroller.net/libsr/redis"

	"github.com/go-redis/redis/v8"
)

// ErrTransactionAborted means that a transaction was aborted and should be retried
var ErrTransactionAborted = errs.Internalf("transaction aborted")

// Exists returns whether the given game exists in Redis.
func Exists(ctx context.Context, client redis.Cmdable, gameID string) (bool, error) {
	ctx, span := srOtel.Tracer.Start(ctx, "game.Exists")
	defer span.End()
	num, err := client.Exists(ctx, "game:"+gameID).Result()
	if err != nil {
		return false, srOtel.WithSetErrorf(span, "checking if game exists: %w", err)
	}
	return num == 1, nil
}

// HasGM determines if the given game has the given GM.
func HasGM(ctx context.Context, client redis.Cmdable, gameID string, playerID id.UID) (bool, error) {
	ctx, span := srOtel.Tracer.Start(ctx, "game.HasGM")
	defer span.End()
	has, err := client.SIsMember(ctx, "gm:"+gameID, string(playerID)).Result()
	if err != nil {
		return false, srOtel.WithSetErrorf(span, "checking if player is GM: %w", err)
	}
	return has, nil
}

// GetGMs returns the list of GMs from a game.
func GetGMs(ctx context.Context, client redis.Cmdable, gameID string) ([]string, error) {
	ctx, span := srOtel.Tracer.Start(ctx, "game.HasGM")
	defer span.End()
	gms, err := client.SMembers(ctx, "gms:"+gameID).Result()
	if err != nil {
		return nil, srOtel.WithSetErrorf(span, "getting gms for game: %w", err)
	}
	return gms, nil
}

// IsGM is string array contains
func IsGM(gms []string, playerID id.UID) bool {
	for _, gmID := range gms {
		if gmID == string(playerID) {
			return true
		}
	}
	return false
}

func IsGMOf(game *Info, playerID id.UID) bool {
	return IsGM(game.GMs, playerID)
}

// Create creates a new game with the given ID.
// Returns BadRequest if the game already exists, but does not override
func Create(ctx context.Context, client redis.Cmdable, gameID string) error {
	ctx, span := srOtel.Tracer.Start(ctx, "game.Create")
	defer span.End()
	created, err := client.HSetNX(ctx, "game:"+gameID, "event_id", "0").Result()
	if err != nil {
		return srOtel.WithSetErrorf(span, "creating game: %w", err)
	}
	if !created {
		return errs.BadRequestf("creating game: game %v already exists", gameID)
	}
	return nil
}

// AddGM adds a gm to the given game idempotently.
func AddGM(ctx context.Context, client redis.Cmdable, gameID string, playerID id.UID) error {
	ctx, span := srOtel.Tracer.Start(ctx, "game.Create")
	defer span.End()
	_, err := client.SAdd(ctx, "gms:"+gameID, playerID.String()).Result()
	if err != nil {
		return srOtel.WithSetErrorf(span, "adding gm to game: %w", err)
	}
	return nil
}

// GetPlayers gets the players in a game.
// Returns ErrBadRequest if the game does not have any players.
func GetPlayers(ctx context.Context, client *redis.Client, gameID string) ([]player.Player, error) {
	ctx, span := srOtel.Tracer.Start(ctx, "game.GetPlayers")
	defer span.End()
	var players []player.Player
	watched := func(tx *redis.Tx) error {
		playerIDs, err := tx.SMembers(ctx, "players:"+gameID).Result()
		if err != nil && err != redis.Nil {
			return srOtel.WithSetErrorf(span, "getting players:gameID: %w", err)
		}
		if err == redis.Nil || len(playerIDs) == 0 {
			return errs.ErrNotFound
		}
		for _, playerID := range playerIDs {
			plr, err := player.GetByID(ctx, tx, playerID)
			if err != nil {
				return srOtel.WithSetErrorf(span,
					"getting info on player %v: %w", playerID, err)
			}
			players = append(players, *plr)
		}
		return nil
	}

	err := redisUtil.RetryWatchTxn(ctx, client, watched, "players:"+gameID)
	if errors.Is(err, errs.ErrNotFound) {
		return nil, err
	} else if err != nil {
		return nil, srOtel.WithSetErrorf(span, "running transaction: %w", err)
	}
	return players, nil
}

// Info represents basic info about a game that the frontend would want
// by default, all at once.
type Info struct {
	ID      string                 `json:"id"`
	Players map[string]player.Info `json:"players"`
	GMs     []string               `json:"gms"`
}

// GetInfo retrieves `Info` for the given ID.
// Returns ErrNotFound if the game does not exist.
func GetInfo(ctx context.Context, client *redis.Client, gameID string) (*Info, error) {
	ctx, span := srOtel.Tracer.Start(ctx, "game.GetInfo")
	defer span.End()
	players, err := GetPlayers(ctx, client, gameID)
	if errors.Is(err, errs.ErrNotFound) {
		return nil, err
	} else if err != nil {
		return nil, srOtel.WithSetErrorf(span,
			"getting players in game %v: %w", gameID, err)
	}
	if len(players) == 0 {
		exists, err := Exists(ctx, client, gameID)
		if err != nil {
			return nil, srOtel.WithSetErrorf(span,
				"checking if game really exists: %w", err,
			)
		}
		if !exists {
			return nil, errs.BadRequestf("game %v does not exist", gameID)
		}
	}
	gms, err := GetGMs(ctx, client, gameID)
	if err != nil {
		return nil, srOtel.WithSetErrorf(span,
			"getting GMs in game %v: %w", gameID, err)
	}
	info := make(map[string]player.Info, len(players))
	for _, player := range players {
		info[string(player.ID)] = player.Info()
	}
	return &Info{ID: gameID, Players: info, GMs: gms}, nil
}
