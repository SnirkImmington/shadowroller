package game_test

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"testing"
	"time"

	//"time"

	eventGen "sr/gen/event"
	gameGen "sr/gen/game"
	playerGen "sr/gen/player"

	"sr/event"
	"sr/game"
	"sr/test"
	"sr/update"
)

func TestPostEvent(t *testing.T) {
	ctx := context.Background()
	rng := test.RNG()
	db, client := test.GetRedis(t)

	gameID := gameGen.GameID(rng)
	err := game.Create(ctx, client, gameID)
	test.AssertSuccess(t, err, "game created")
	plr := playerGen.Player(rng)

	t.Run("private update posted", func(t *testing.T) {
		sub := db.NewSubscriber()
		defer sub.Close()
		privateChannel := fmt.Sprintf("update:%v:%v", gameID, plr.ID)
		sub.Subscribe(privateChannel)
		defer sub.Unsubscribe(privateChannel)

		evt := eventGen.Event(rng, plr)
		evt.SetShare(event.SharePrivate)
		ud := update.ForNewEvent(evt)
		udBytes, err := json.Marshal(ud)
		test.AssertSuccess(t, err, "writing update to json")

		var wait sync.WaitGroup
		wait.Add(1)
		go func() {
			defer wait.Done()
			select {
			case msg := <-sub.Messages():
				test.AssertEqual(t, string(udBytes), msg.Message)
			case <-time.After(time.Duration(5) * time.Second):
				t.Error("Did not read update")
			}
		}()

		err = game.PostEvent(ctx, client, gameID, evt)
		test.AssertSuccess(t, err, "event posted")

		wait.Wait()
	})
}
