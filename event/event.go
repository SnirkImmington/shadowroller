package event

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/gomodule/redigo/redis"
	redisUtil "sr/redis"
	"strconv"
	"strings"
)

// ValidID returns whether the non-empty-string id is valid.
func ValidID(id string) bool {
	_, err := strconv.ParseUint(id, 10, 64)
	return err == nil
}

// GetByID retrieves a single event from Redis via its ID.
func GetByID(gameID string, eventID int64, conn redis.Conn) (string, error) {
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

// GetLatest retrieves the latest count history events for the given game.
func GetLatest(gameID string, count int, conn redis.Conn) ([]string, error) {
	return GetOlderThan(gameID, "+inf", count, conn)
}

// GetOlderThan retrieves a range of history events older than the given event.
func GetOlderThan(gameID string, newest string, count int, conn redis.Conn) ([]string, error) {
	return GetBetween(gameID, newest, "-inf", count, conn)
}

// GetBetween returns up to count events between the given newest and oldest IDs.
func GetBetween(gameID string, newest string, oldest string, count int, conn redis.Conn) ([]string, error) {
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

// BulkUpdate updates all of the given events at once
func BulkUpdate(gameID string, events []Event, conn redis.Conn) error {
	if err := conn.Send("MULTI"); err != nil {
		return fmt.Errorf("sending `MULTI`: %w", err)
	}
	for ix, evt := range events {
		eventID := evt.GetID()
		eventBytes, err := json.Marshal(evt)
		if err != nil {
			return fmt.Errorf("marshaling event %v (%v %v) to JSON: %w",
				ix, evt.GetType(), evt.GetID(), err,
			)
		}

		err = conn.Send("ZREMRANGEBYSCORE", "history:"+gameID, eventID, eventID)
		if err != nil {
			return fmt.Errorf("sending `ZREMRANGEBYSCORE` #%v: %w", ix, err)
		}
		err = conn.Send("ZADD", "history:"+gameID, "NX", eventID, eventBytes)
		if err != nil {
			return fmt.Errorf("sending `ZADD` #%v: %w", ix, err)
		}
	}
	// [#deleted = 1, #added = 1, ... * len(events)]
	results, err := redis.Ints(conn.Do("EXEC"))
	if err != nil {
		return fmt.Errorf("sending `EXEC` and getting Ints: %w", err)
	}
	if len(results) != len(events)*2 {
		return fmt.Errorf("Unexpected # of results: expected %v got %v",
			len(events)*2, len(results),
		)
	}
	return nil
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

	conn := redisUtil.Connect()

	sub := redis.PubSubConn{Conn: conn}
	if err := sub.Subscribe("history:"+gameID, "update:"+gameID); err != nil {
		errChan <- fmt.Errorf("unable to subscribe to update channels: %w", err)
		return events, errChan
	}

	go func() {
		defer func() {
			redisUtil.Close(conn)
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
