package event

import (
	"context"
	"fmt"
	"testing"

	"sr/game"
	"sr/gen"
	"sr/id"
	"sr/player"
	"sr/test"
)

func TestValidID(t *testing.T) {
	test.RunParallel(t, "matches valid IDs", func(t *testing.T) {
		for i := 0; i < 20; i++ {
			id := id.NewEventID()
			test.AssertCheck(t, id, ValidID(fmt.Sprintf("%v", id)), "validID")
		}
	})
	// it's one line of code that calls parse number, this is fine.
}

func TestGetByID(t *testing.T) {
	ctx := context.Background()
	_, client := test.GetRedis(t)
	rng := test.RNG()

	gameID := gen.GameID(rng)
	plr := gen.Player(rng)

	err := game.Create(ctx, client, gameID)
	test.AssertSuccess(t, err, "creating game")

	err = player.Create(ctx, client, plr)
	test.AssertSuccess(t, err, "creating player")

}
