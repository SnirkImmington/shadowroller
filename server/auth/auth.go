package auth

import (
	"context"
	"errors"
	"fmt"
	"sr/game"
	"sr/player"

	"github.com/go-redis/redis/v8"
)

// ErrNotAuthorized is an error for when a user cannot perform an action
var ErrNotAuthorized = errors.New("not authorized")

// LogPlayerIn checks username/gameID credentials and returns the relevant
// GameInfo for the client.
//
// Returns ErrPlayerNotFound if the username is not found, ErrGameNotFound if
// the game is not found. These should not be distinguished to users.
func LogPlayerIn(ctx context.Context, client *redis.Client, gameID string, username string) (*game.Info, *player.Player, error) {
	plr, err := player.GetByUsername(ctx, client, username)
	if errors.Is(err, player.ErrNotFound) {
		return nil, nil, fmt.Errorf("%w (%v logging into %v)", err, username, gameID)
	} else if err != nil {
		return nil, nil, fmt.Errorf("redis error getting %v: %w", username, err)
	}

	info, err := game.GetInfo(ctx, client, gameID)
	if errors.Is(err, game.ErrNotFound) {
		return nil, nil, fmt.Errorf("when logging %v in to %v: %w", username, gameID, err)
	} else if err != nil {
		return nil, nil, fmt.Errorf("redis error fetching game info for %v: %w", gameID, err)
	}

	// Ensure player is in the game
	if _, found := info.Players[string(plr.ID)]; !found {
		return nil, nil, fmt.Errorf(
			"%w: player %v (%v) to %v",
			ErrNotAuthorized, plr.ID, username, gameID,
		)
	}
	return info, plr, nil
}
