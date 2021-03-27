package game

import (
	"encoding/json"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"sr/event"
	"sr/player"
	"sr/update"
)

// PlayerCanSeeEvent determines if the given player can see the given event
func PlayerCanSeeEvent(plr *player.Player, evt event.Event) bool {
	return (evt.GetShare() == event.ShareInGame) ||
		(evt.GetShare() == event.SharePrivate && evt.GetPlayerID() == plr.ID)
}

// EventChannel produces the channel an event should be posted in
func EventChannel(gameID string, evt event.Event) string {
	share := evt.GetShare()
	if share == event.ShareInGame {
		return "history:" + gameID
	} else if share == event.SharePrivate {
		return "history:" + string(evt.GetPlayerID()) + ":" + gameID
	} else {
		panic(fmt.Sprintf("Invalid share for event %s", evt))
	}
}

// UpdateChannel produces the channel an event should be updated in
func UpdateChannel(gameID string, evt event.Event) string {
	share := evt.GetShare()
	if share == event.ShareInGame {
		return "update:" + gameID
	} else if share == event.SharePrivate {
		return "update:" + string(evt.GetPlayerID()) + ":" + gameID
	} else {
		panic(fmt.Sprintf("Invalid share for event %s", evt))
	}
}

// PostEvent adds an event to redis, sending an update for non-private events
func PostEvent(gameID string, evt event.Event, conn redis.Conn) error {
	channel := EventChannel(gameID, evt)
	bytes, err := json.Marshal(evt)
	if err != nil {
		return fmt.Errorf("unable to marshal event to JSON: %w", err)
	}

	err = conn.Send("MULTI")
	if err != nil {
		return fmt.Errorf("redis error initiating event post: %w", err)
	}
	err = conn.Send("ZADD", "history:"+gameID, "NX", evt.GetID(), bytes)
	if err != nil {
		return fmt.Errorf("redis error sending add event to history: %w", err)
	}
	err = conn.Send("PUBLISH", channel, bytes)
	if err != nil {
		return fmt.Errorf("redis error sending publish event to history: %w", err)
	}
	results, err := redis.Ints(conn.Do("EXEC"))
	if err != nil {
		return fmt.Errorf("redis error EXECing event post: %w", err)
	}
	if len(results) != 2 || results[0] != 1 {
		return fmt.Errorf("redis error posting event, expected [1, *], got %v", results)
	}
	return nil
}

// DeleteEvent removes an event from a game and updates the game's connected players.
func DeleteEvent(gameID string, evt event.Event, conn redis.Conn) error {
	channel := UpdateChannel(gameID, evt)
	eventID := evt.GetID()
	updateBytes, err := json.Marshal(update.ForEventDelete(eventID))
	if err != nil {
		return fmt.Errorf("redis error marshalling event delete update: %w", err)
	}

	// MULTI: delete old event and publish update
	err = conn.Send("MULTI")
	if err != nil {
		return fmt.Errorf("redis error initializing event delete: %w", err)
	}
	err = conn.Send("ZREMRANGEBYSCORE", "history:"+gameID, eventID, eventID)
	if err != nil {
		return fmt.Errorf("redis error sending event delete: %w", err)
	}
	err = conn.Send("PUBLISH", channel, updateBytes)
	if err != nil {
		return fmt.Errorf("redis error sending event publish: %w", err)
	}

	// EXEC: [#deleted=1, #updated]
	results, err := redis.Ints(conn.Do("EXEC"))
	if err != nil {
		return fmt.Errorf("redis error EXECing event post: %w", err)
	}
	if len(results) != 2 {
		return fmt.Errorf("redis error deleting event, expected 2 results got %v", results)
	}
	if results[0] != 1 {
		return fmt.Errorf("redis error deleting event, expected [1, *], got %v", results)
	}
	return nil
}

// UpdateEventShare changes the sharing of an event
func UpdateEventShare(gameID string, evt event.Event, newShare event.Share, conn redis.Conn) error {
	if evt.GetShare() == newShare {
		return fmt.Errorf("event %s matches share %s", evt, newShare.String())
	}

	// Here's the current update matrix:

	// game priv => del game, create priv
	// priv game => del priv, create game

	// Suffice to delete from group, then create in new group

	if err := DeleteEvent(gameID, evt, conn); err != nil {
		return fmt.Errorf("deleting event: %w", err)
	}
	evt.SetShare(newShare)
	if err := PostEvent(gameID, evt, conn); err != nil {
		return fmt.Errorf("posting event: %w", err)
	}
	return nil

	// game GMs => del game, (create GMs, create priv)
	// GMs game => (del GMs, del priv), create game
	// priv Gms => _, create GMs
	// Gms priv => del Gms, _
}

// UpdateEvent replaces an event in the database and notifies players of the change.
func UpdateEvent(gameID string, newEvent event.Event, update update.Event, conn redis.Conn) error {
	channel := UpdateChannel(gameID, newEvent)
	eventID := newEvent.GetID()
	eventBytes, err := json.Marshal(newEvent)
	if err != nil {
		return fmt.Errorf("unable to marshal event to JSON: %w", err)
	}
	updateBytes, err := json.Marshal(update)
	if err != nil {
		return fmt.Errorf("unable to marshal update to JSON: %w", err)
	}

	// MULTI: delete old event, insert new event, publish update
	err = conn.Send("MULTI")
	if err != nil {
		return fmt.Errorf("redis error initializing event delete: %w", err)
	}
	// From what I can tell, ZADD does not let you update an existing element
	// with the given score atomically. Since this is MULTI anyway, we delete
	// the old event and add the new one.
	// Ideally, we'd use ZDEL like we do in DeleteEvent() but I don't want the
	// old event as a parameter and this at least helps prevent event duplication.
	err = conn.Send("ZREMRANGEBYSCORE", "history:"+gameID, eventID, eventID)
	if err != nil {
		return fmt.Errorf("redis error sending event delete: %w", err)
	}
	err = conn.Send("ZADD", "history:"+gameID, "NX", eventID, eventBytes)
	if err != nil {
		return fmt.Errorf("redis error sending event delete: %w", err)
	}
	err = conn.Send("PUBLISH", channel, updateBytes)
	if err != nil {
		return fmt.Errorf("redis error sending event publish: %w", err)
	}

	// EXEC: [#deleted=1, #added=1, #players]
	results, err := redis.Ints(conn.Do("EXEC"))
	if err != nil {
		return fmt.Errorf("redis error EXECing event post: %w", err)
	}
	if len(results) != 3 || results[0] != 1 || results[1] != 1 {
		return fmt.Errorf("redis error updating event, expected [1, 1, *], got %v", results)
	}
	return nil
}
