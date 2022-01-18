package auth

import (
	"context"
	"errors"

	"shadowroller.net/libsr/errs"
	"sr/game"
	srOtel "shadowroller.net/libsr/otel"
	"sr/player"

	"github.com/go-redis/redis/v8"
)

// LogPlayerIn checks username/gameID credentials and returns the relevant
// GameInfo for the client.
//
// Returns ErrNotFound if the game or player does not exist, ErrNoAccess if the
// player does not have access to the game.
func LogPlayerIn(ctx context.Context, client *redis.Client, gameID string, username string) (*game.Info, *player.Player, error) {
	ctx, span := srOtel.Tracer.Start(ctx, "auth.LogPlayerIn")
	defer span.End()

	plr, err := player.GetByUsername(ctx, client, username)
	if errors.Is(err, errs.ErrNotFound) {
		return nil, nil, errs.NotFoundf("player %v", username)
	} else if err != nil {
		return nil, nil, srOtel.WithSetErrorf(span, "getting player %v: %w", username, err)
	}

	info, err := game.GetInfo(ctx, client, gameID)
	if errors.Is(err, errs.ErrNotFound) || errors.Is(err, errs.ErrBadRequest) {
		return nil, nil, errs.NotFoundf("game %v", gameID)
	} else if err != nil {
		return nil, nil, srOtel.WithSetErrorf(span,
			"fetching game info: %w", err)
	}

	// Ensure player is in the game
	if _, found := info.Players[string(plr.ID)]; !found {
		return nil, nil, errs.NoAccessf(
			"player %v (%v) to %v", plr.ID, username, gameID)
	}
	return info, plr, nil
}
