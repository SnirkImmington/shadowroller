package sr

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"log"
	"strconv"
	"strings"
)

// PostEvent posts an event to Redis and returns the generated ID.
func PostEvent(gameID string, event Event, conn redis.Conn) error {
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
	if len(results) != 2 {
		return fmt.Errorf("redis error posting event, expected 2 results, got %v", results)
	}
	if results[0] != 1 {
		log.Printf(
			"Unexpected result from posting event: expected [1, *], got %v",
			results,
		)
	}

	return nil
}

// DeleteEvent removes an event from a game and updates the game's connected players.
func DeleteEvent(gameID string, eventID int64, conn redis.Conn) error {
	updateBytes, err := json.Marshal(EventDeleteUpdate(eventID))
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

// UpdateEvent replaces an event in the database and notifies players of the change.
func UpdateEvent(gameID string, newEvent Event, update EventUpdate, conn redis.Conn) error {
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

// EventByID retrieves a single event from Redis via its ID.
func EventByID(gameID string, eventID int64, conn redis.Conn) (string, error) {
	events, err := redis.Strings(conn.Do(
		"ZREVRANGEBYSCORE",
		"history:"+gameID,
		eventID, eventID,
		"LIMIT", "0", "1",
	))
	if err != nil {
		return "", fmt.Errorf("redis error finding event by ID: %w", err)
	}
	if len(events) == 0 {
		return "", fmt.Errorf("no event %v found in %v", eventID, gameID)
	}
	return events[0], nil
}

// LatestEvents retrieves the latest count history events for the given game.
func LatestEvents(gameID string, count int, conn redis.Conn) ([]string, error) {
	return EventsOlderThan(gameID, "+inf", count, conn)
}

// EventsOlderThan retrieves a range of history events older than the given event.
func EventsOlderThan(gameID string, newest string, count int, conn redis.Conn) ([]string, error) {
	return EventsBetween(gameID, newest, "-inf", count, conn)
}

// EventsBetween returns up to count events between the given newest and oldest IDs.
func EventsBetween(gameID string, newest string, oldest string, count int, conn redis.Conn) ([]string, error) {
	events, err := redis.Strings(conn.Do(
		"ZREVRANGEBYSCORE",
		"history:"+gameID,
		newest, "-inf",
		"LIMIT", "0", count,
	))
	if err != nil {
		return nil, fmt.Errorf("Redis error finding events older than %v: %w", newest, err)
	}

	return events, nil
}

// ValidEventID returns whether the non-empty-string id is valid.
func ValidEventID(id string) bool {
	_, err := strconv.ParseUint(id, 10, 64)
	return err == nil
}

// SubscribeToGame starts a goroutine that reads from the given game's history
// and update channels.
// Each update is sent over the returned string channel, with a prefix "event:"
// for events and "update:" for updates.
// The given context is used for its cancellation function. Errors (such as being
// canceled) are sent over the error channel.
func SubscribeToGame(ctx context.Context, gameID string) (<-chan string, <-chan error) {
	events := make(chan string)
	errChan := make(chan error, 1)

	conn := RedisPool.Get()

	sub := redis.PubSubConn{Conn: conn}
	if err := sub.Subscribe("history:"+gameID, "update:"+gameID); err != nil {
		errChan <- fmt.Errorf("unable to subscribe to update channels: %w", err)
		return events, errChan
	}

	go func() {
		defer func() {
			CloseRedis(conn)
			close(events)
			close(errChan)
		}()
		for {
			select {
			case <-ctx.Done():
				errChan <- fmt.Errorf("received done from context: %w", ctx.Err())
				return
			default:
			}
			switch msg := sub.Receive().(type) {
			case error:
				errChan <- fmt.Errorf("error from Redis Receive(): %w", msg)
				return
			case redis.Message:
				message := string(msg.Data)
				if strings.HasPrefix(msg.Channel, "history") {
					message = "event:" + message
				} else {
					message = "update:" + message
				}
				events <- message
			}
		}
	}()
	return events, errChan
}
