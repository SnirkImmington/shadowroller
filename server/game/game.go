package game

import (
	"context"
	"errors"
	"fmt"

	"sr/id"
	srOtel "sr/otel"
	"sr/player"
	redisUtil "sr/redis"

	"github.com/go-redis/redis/v8"
)

// ErrNotFound means that a specified game does not exists
var ErrNotFound = errors.New("game not found")

// ErrTransactionAborted means that a transaction was aborted and should be retried
var ErrTransactionAborted = errors.New("transaction aborted")

// Exists returns whether the given game exists in Redis.
func Exists(ctx context.Context, client redis.Cmdable, gameID string) (bool, error) {
	num, err := client.Exists(ctx, "game:"+gameID).Result()
	return num == 1, err
}

// HasGM determines if the given game has the given GM
func HasGM(ctx context.Context, client redis.Cmdable, gameID string, playerID id.UID) (bool, error) {
	return client.SIsMember(ctx, "gm:"+gameID, string(playerID)).Result()
}

// GetGMs returns the list of GMs from a game.
func GetGMs(ctx context.Context, client redis.Cmdable, gameID string) ([]string, error) {
	return client.SMembers(ctx, "gms:"+gameID).Result()
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
func Create(ctx context.Context, client redis.Cmdable, gameID string) error {
	ctx, span := srOtel.Tracer.Start(ctx, "game.Create")
	defer span.End()
	created, err := client.HSet(ctx, "game:"+gameID, "event_id", "0").Result()
	if err != nil {
		return srOtel.WithSetErrorf(span, "creating game %v: %w", gameID, err)
	}
	if created != 1 {
		return srOtel.WithSetErrorf(span,
			"creating game %v: expected to set 1, got %v", gameID, created)
	}
	return nil
}

// AddGM adds a gm to the given game
func AddGM(ctx context.Context, client redis.Cmdable, gameID string, playerID id.UID) error {
	added, err := client.SAdd(ctx, "gms:"+gameID, playerID.String()).Result()
	if err != nil {
		return fmt.Errorf("adding gm %v to %v: %w", playerID, gameID, err)
	}
	if added != 1 {
		return fmt.Errorf("adding gm %v to %v: expected 1, got %v", playerID, gameID, added)
	}
	return nil
}

// GetPlayers gets the players in a game.
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
			return nil
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
	if err != nil {
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

// GetInfo retrieves `Info` for the given ID
func GetInfo(ctx context.Context, client *redis.Client, gameID string) (*Info, error) {
	ctx, span := srOtel.Tracer.Start(ctx, "game.GetInfo")
	defer span.End()
	players, err := GetPlayers(ctx, client, gameID)
	if err != nil {
		return nil, srOtel.WithSetErrorf(span,
			"getting players in game %v: %w", gameID, err)
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
