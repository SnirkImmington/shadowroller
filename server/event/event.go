package event

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"

	"github.com/go-redis/redis/v8"
)

var ErrNotFound = errors.New("event not found")

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
		return "", fmt.Errorf("%w: no event %v found in %v", ErrNotFound, eventID, gameID)
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
		Max: newest, Min: oldest,
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
	gameKey := "history:" + gameID
	eventStrings := make([]string, len(events))
	for ix, evt := range events {
		eventBytes, err := json.Marshal(evt)
		if err != nil {
			return fmt.Errorf("marshal event #%v (%v %v): %w",
				ix, evt.GetType(), evt.GetID(), err,
			)
		}
		eventStrings[ix] = string(eventBytes)
	}
	results, err := client.Pipelined(ctx, func(pipe redis.Pipeliner) error {
		for ix, evt := range events {
			eventID := evt.GetID()
			eventIDStr := fmt.Sprintf("%v", eventID)
			eventString := eventStrings[ix]
			if err := pipe.ZRemRangeByScore(ctx, gameKey, eventIDStr, eventIDStr).Err(); err != nil {
				return fmt.Errorf("sending remove event: %w", err)
			}
			if err := pipe.ZAddNX(ctx, gameKey, &redis.Z{Score: float64(eventID), Member: eventString}).Err(); err != nil {
				return fmt.Errorf("sending add event: %w", err)
			}
		}
		return nil
	})
	// [#deleted = 1, #added = 1, ... * len(events)]
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
