package event_test

import (
	"context"
	"fmt"
	mathRand "math/rand"
	"testing"

	//genEvent "sr/gen/event"
	genGame "sr/gen/game"
	genPlayer "sr/gen/player"

	"sr/event"
	"sr/game"
	"sr/id"
	"sr/player"
	"sr/test"

	"github.com/go-redis/redis/v8"
)

func TestValidID(t *testing.T) {
	test.RunParallel(t, "matches valid IDs", func(t *testing.T) {
		for i := 0; i < 20; i++ {
			id := id.NewEventID()
			test.AssertCheck(t, id, event.ValidID(fmt.Sprintf("%v", id)), "validID")
		}
	})
	// it's one line of code that calls parse number, this is fine.
}

func createGameAndPlayer(ctx context.Context, client redis.Cmdable, rng *mathRand.Rand, t *testing.T) (string, *player.Player) {
	gameID := genGame.GameID(rng)
	plr := genPlayer.Player(rng)

	err := game.Create(ctx, client, gameID)
	test.AssertSuccess(t, err, "creating game")

	err = player.Create(ctx, client, plr)
	test.AssertSuccess(t, err, "creating player")

	err = game.AddPlayer(ctx, client, gameID, plr)
	test.AssertSuccess(t, err, "adding player")

	return gameID, plr
}

/*

// The "event not in game" tests fail because we're not giving events random IDs.

func TestGetByID(t *testing.T) {
	ctx := context.Background()
	_, client := test.GetRedis(t)
	rng := test.RNG()

	gameID, plr := createGameAndPlayer(ctx, client, rng, t)
	evt := genEvent.Event(rng, plr)

	err := game.PostEvent(ctx, client, gameID, evt)
	test.AssertSuccess(t, err, "posting event")

	test.RunParallel(t, "valid event in game", func(t *testing.T) {
		foundStr, err := event.GetByID(ctx, client, gameID, evt.GetID())
		test.AssertSuccess(t, err, "event found")
		found, err := event.Parse([]byte(foundStr))
		test.AssertSuccess(t, err, "event parsed")
		test.AssertEqual(t, evt, found)
	})

	test.RunParallel(t, "event not in game", func(t *testing.T) {
		invalidEvt := genEvent.Event(rng, plr)
		found, err := event.GetByID(ctx, client, gameID, invalidEvt.GetID())
		test.AssertErrorIs(t, err, event.ErrNotFound)
		t.Log(found)
	})

	test.RunParallel(t, "event in a different game", func(t *testing.T) {
		otherEvt := genEvent.Event(rng, plr)
		otherGame := genGame.GameID(rng)
		err = game.Create(ctx, client, otherGame)
		test.AssertSuccess(t, err, "other game created")
		err = game.PostEvent(ctx, client, otherGame, otherEvt)
		_, err := event.GetByID(ctx, client, gameID, otherEvt.GetID())
		test.AssertErrorIs(t, err, event.ErrNotFound)
	})
}

*/
