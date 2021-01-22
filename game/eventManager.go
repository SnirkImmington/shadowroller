package game

import (
	"encoding/json"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"sr/event"
	"sr/update"
)

// PostEvent posts an event to Redis and returns the generated ID.
func PostEvent(gameID string, event event.Event, conn redis.Conn) error {
	bytes, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("unable to marshal event to JSON: %w", err)
	}

	err = conn.Send("MULTI")
	if err != nil {
		return fmt.Errorf("redis error initiating event post: %w", err)
	}
	err = conn.Send("ZADD", "history:"+gameID, "NX", event.GetID(), bytes)
	if err != nil {
		return fmt.Errorf("redis error sending add event to history: %w", err)
	}
	err = conn.Send("PUBLISH", "history:"+gameID, bytes)
	if err != nil {
		return fmt.Errorf("redis error ending publish event to history: %w", err)
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
func DeleteEvent(gameID string, eventID int64, conn redis.Conn) error {
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
	err = conn.Send("PUBLISH", "update:"+gameID, updateBytes)
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

// Update replaces an event in the database and notifies players of the change.
func UpdateEvent(gameID string, newEvent event.Event, update update.Event, conn redis.Conn) error {
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
	err = conn.Send("PUBLISH", "update:"+gameID, updateBytes)
	if err != nil {
		return fmt.Errorf("redis error sending event publish: %w", err)
	}

	// EXEC: [#deleted=1, #added=1, #players]
	results, err := redis.Ints(conn.Do("EXEC"))
	if err != nil {
		return fmt.Errorf("redis error EXECing event post: %w", err)
	}
	if len(results) != 3 {
		return fmt.Errorf("redis error updating event, expected 2 results got %v", results)
	}
	if results[0] != 1 {
		return fmt.Errorf("redis error deleting event, expected [1, 1, *], got %v", results)
	}
	if results[1] != 1 {
		return fmt.Errorf("redis error re-adding event, expected [1, 1, *], got %v", results)
	}
	return nil
}
