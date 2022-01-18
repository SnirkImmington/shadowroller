package game_test

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"
	"time"

	eventGen "shadowroller.net/libsr/gen/event"
	gameGen "shadowroller.net/libsr/gen/game"
	playerGen "shadowroller.net/libsr/gen/player"

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

		wait := test.WaitForMessage(t, sub.Messages(), string(udBytes))

		err = game.PostEvent(ctx, client, gameID, evt)
		test.AssertSuccess(t, err, "event posted")

		wait.Wait()
	})

	t.Run("event was added", func(t *testing.T) {
		time.Sleep(time.Duration(50) * time.Millisecond)
		evt := eventGen.Event(rng, plr)
		evtStr, err := json.Marshal(evt)
		test.AssertSuccess(t, err, "event was marshalled")

		err = game.PostEvent(ctx, client, gameID, evt)
		test.AssertSuccess(t, err, "event was posted")

		found, err := event.GetByID(ctx, client, gameID, evt.GetID())
		test.AssertSuccess(t, err, "event was found")
		test.AssertEqual(t, string(evtStr), found)
	})
}

func TestDeleteEvent(t *testing.T) {
	ctx := context.Background()
	rng := test.RNG()
	db, client := test.GetRedis(t)

	gameID := gameGen.GameID(rng)
	err := game.Create(ctx, client, gameID)
	test.AssertSuccess(t, err, "game created")
	plr := playerGen.Player(rng)

	t.Run("private update posted", func(t *testing.T) {
		evt := eventGen.Event(rng, plr)
		evt.SetShare(event.SharePrivate)
		err = game.PostEvent(ctx, client, gameID, evt)
		test.AssertSuccess(t, err, "event posted")

		sub := db.NewSubscriber()
		defer sub.Close()
		privateChannel := fmt.Sprintf("update:%v:%v", gameID, plr.ID)
		sub.Subscribe(privateChannel)
		defer sub.Unsubscribe(privateChannel)

		ud := update.ForEventDelete(evt.GetID())
		udBytes, err := ud.MarshalJSON()
		test.AssertSuccess(t, err, "update marshalled")

		wait := test.WaitForMessage(t, sub.Messages(), string(udBytes))

		err = game.DeleteEvent(ctx, client, gameID, evt)
		test.AssertSuccess(t, err, "event deleted")

		wait.Wait()
	})

	t.Run("event was deleted", func(t *testing.T) {
		// Offset event ID
		time.Sleep(time.Duration(50) * time.Millisecond)
		evt := eventGen.Event(rng, plr)
		evtStr, err := json.Marshal(evt)
		test.AssertSuccess(t, err, "event was marshalled")

		err = game.PostEvent(ctx, client, gameID, evt)
		test.AssertSuccess(t, err, "event was posted")

		found, err := event.GetByID(ctx, client, gameID, evt.GetID())
		test.AssertSuccess(t, err, "event was found")
		test.AssertEqual(t, string(evtStr), found)
	})
}

func TestUpdateEventShare(t *testing.T) {
	ctx := context.Background()
	rng := test.RNG()
	db, client := test.GetRedis(t)

	gameID := gameGen.GameID(rng)
	err := game.Create(ctx, client, gameID)
	test.AssertSuccess(t, err, "game created")
	plr := playerGen.Player(rng)

	t.Run("private2game: single diff update posted", func(t *testing.T) {
		evt := eventGen.Event(rng, plr)
		evt.SetShare(event.SharePrivate)
		err = game.PostEvent(ctx, client, gameID, evt)
		test.AssertSuccess(t, err, "event posted")

		sub := db.NewSubscriber()
		defer sub.Close()
		privateChannel := fmt.Sprintf("update:%v:%v", gameID, plr.ID)
		sub.Subscribe(privateChannel)
		defer sub.Unsubscribe(privateChannel)

		ud := update.ForEventDiff(evt, map[string]interface{}{"share": event.ShareInGame})
		udBytes, err := ud.MarshalJSON()
		test.AssertSuccess(t, err, "update marshalled")

		wait := test.WaitForMessage(t, sub.Messages(), string(udBytes))

		err = game.UpdateEventShare(ctx, client, gameID, evt, event.ShareInGame)
		test.AssertSuccess(t, err, "event share updated")

		wait.Wait()
	})

	t.Run("event share was updated", func(t *testing.T) {
		// Offset event ID
		time.Sleep(time.Duration(50) * time.Millisecond)
		evt := eventGen.Event(rng, plr)
		err = game.PostEvent(ctx, client, gameID, evt)
		test.AssertSuccess(t, err, "event was posted")

		oldShare := evt.GetShare()
		var newShare event.Share
		for {
			newShare = eventGen.Share(rng)
			if newShare != oldShare {
				break
			}
		}
		t.Logf("Event %v share %v -> %v", evt.GetID(), oldShare, newShare)
		err := game.UpdateEventShare(ctx, client, gameID, evt, newShare)
		// evt's share has also been updated
		test.AssertSuccess(t, err, "event share updated")

		evtStr, err := json.Marshal(evt) // has new share
		test.AssertSuccess(t, err, "event was marshalled")

		found, err := event.GetByID(ctx, client, gameID, evt.GetID())
		test.AssertSuccess(t, err, "event was found")
		test.AssertEqual(t, string(evtStr), found)
	})

}
