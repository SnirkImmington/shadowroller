package event

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/go-redis/redis/v8"
)

// ValidID returns whether the non-empty-string id is valid.
func ValidID(id string) bool {
	_, err := strconv.ParseUint(id, 10, 64)
	return err == nil
}

// ValidRerollType determines if the requested reroll type is valid.
func ValidRerollType(ty string) bool {
	return ty == EventTypeReroll
}

// GetByID retrieves a single event from Redis via its ID.
func GetByID(ctx context.Context, client redis.Cmdable, gameID string, eventID int64) (string, error) {
	eventIDStr := fmt.Sprintf("%v", eventID)
	opts := &redis.ZRangeBy{
		Max: eventIDStr, Min: eventIDStr,
		Offset: 0, Count: 1,
	}
	events, err := client.ZRevRangeByScore(ctx, "history:"+gameID, opts).Result()
	if err != nil {
		return "", fmt.Errorf("redis error finding event by ID: %w", err)
	}
	if len(events) == 0 {
		return "", fmt.Errorf("no event %v found in %v", eventID, gameID)
	}
	return events[0], nil
}

// GetLatest retrieves the latest count history events for the given game.
func GetLatest(ctx context.Context, client redis.Cmdable, gameID string, count int) ([]string, error) {
	return GetOlderThan(ctx, client, gameID, "+inf", count)
}

// GetOlderThan retrieves a range of history events older than the given event.
func GetOlderThan(ctx context.Context, client redis.Cmdable, gameID string, newest string, count int) ([]string, error) {
	return GetBetween(ctx, client, gameID, newest, "-inf", count)
}

// GetBetween returns up to count events between the given newest and oldest IDs.
func GetBetween(ctx context.Context, client redis.Cmdable, gameID string, newest string, oldest string, count int) ([]string, error) {
	opts := &redis.ZRangeBy{
		Max: newest, Min: "-inf",
		Offset: 0, Count: int64(count),
	}
	events, err := client.ZRevRangeByScore(ctx, "history:"+gameID, opts).Result()
	if err != nil {
		return nil, fmt.Errorf("Redis error finding events older than %v: %w", newest, err)
	}

	return events, nil
}

// BulkUpdate updates all of the given events at once
func BulkUpdate(ctx context.Context, client redis.Cmdable, gameID string, events []Event) error {
	pipe := client.Pipeline()
	for ix, evt := range events {
		eventID := evt.GetID()
		eventBytes, err := json.Marshal(evt)
		if err != nil {
			return fmt.Errorf("marshaling event %v (%v %v) to JSON: %w",
				ix, evt.GetType(), evt.GetID(), err,
			)
		}

		pipe.Do(ctx, "ZREMRANGEBYSCORE", "history:"+gameID, eventID, eventID)
		pipe.ZAddNX(ctx, "history:"+gameID, &redis.Z{Score: float64(eventID), Member: eventBytes})
	}
	// [#deleted = 1, #added = 1, ... * len(events)]
	results, err := pipe.Exec(ctx)
	if err != nil {
		return fmt.Errorf("sending `EXEC` and getting Ints: %w", err)
	}
	if len(results) != len(events)*2 {
		return fmt.Errorf("Unexpected # of results: expected %v got %v",
			len(events)*2, results,
		)
	}
	return nil
}
