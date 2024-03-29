package auth

import (
	"context"
	"testing"

	"sr/errs"
	genGame "sr/gen/game"
	genPlayer "sr/gen/player"

	"sr/game"
	"sr/player"
	"sr/test"
)

func TestLogPlayerIn(t *testing.T) {
	ctx := context.Background()
	_, client := test.GetRedis(t)
	rng := test.RNG()

	gameID := genGame.GameID(rng)
	plr := genPlayer.Player(rng)
	plr2 := genPlayer.Player(rng)

	err := game.Create(ctx, client, gameID)
	test.AssertSuccess(t, err, "creating game")

	err = game.AddGM(ctx, client, gameID, plr.ID)
	test.AssertSuccess(t, err, "adding GM")

	err = player.Create(ctx, client, plr)
	test.AssertSuccess(t, err, "creating plr")

	err = player.Create(ctx, client, plr2)
	test.AssertSuccess(t, err, "creating plr")

	err = game.AddPlayer(ctx, client, gameID, plr)
	test.AssertSuccess(t, err, "adding plr to game")

	test.RunParallel(t, "player in game", func(t *testing.T) {
		info, foundPlr, err := LogPlayerIn(ctx, client, gameID, plr.Username)
		test.AssertSuccess(t, err, "logging player in")
		test.AssertEqual(t, plr, foundPlr)
		expectedInfo := &game.Info{
			ID:      gameID,
			Players: map[string]player.Info{plr.ID.String(): plr.Info()},
			GMs:     []string{plr.ID.String()},
		}
		test.AssertEqual(t, expectedInfo, info)

	})

	test.RunParallel(t, "player not in game", func(t *testing.T) {
		_, _, err := LogPlayerIn(ctx, client, gameID, plr2.Username)
		test.AssertErrorIs(t, err, errs.ErrNoAccess)
	})

	test.RunParallel(t, "no game", func(t *testing.T) {
		invalidGameID := genGame.GameID(rng)
		_, _, err := LogPlayerIn(ctx, client, invalidGameID, plr.Username)
		test.AssertErrorIs(t, err, errs.ErrNotFound)
	})

	test.RunParallel(t, "no player", func(t *testing.T) {
		invalidPlr := genPlayer.Player(rng)
		_, _, err := LogPlayerIn(ctx, client, gameID, invalidPlr.Username)
		test.AssertErrorIs(t, err, errs.ErrNotFound)
	})
}
