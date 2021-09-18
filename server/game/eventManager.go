package game

import (
	"context"
	"encoding/json"
	"fmt"
	"sr/event"
	"sr/update"

	"github.com/go-redis/redis/v8"
)

// PostEvent adds an event to redis, sending an update for non-private events.
func PostEvent(ctx context.Context, client redis.Cmdable, gameID string, evt event.Event) error {
	eventBytes, err := json.Marshal(evt)
	if err != nil {
		return fmt.Errorf("marshaling event to JSON: %w", err)
	}

	create := update.ForNewEvent(evt)
	packets := createOrDeletePackets(gameID, evt, create)

	tx := client.TxPipeline()
	tx.ZAddNX(ctx, "history:"+gameID, &redis.Z{Score: float64(evt.GetID()), Member: eventBytes})
	for _, packet := range packets {
		err = publishPacket(ctx, tx, &packet)
		if err != nil {
			return fmt.Errorf("sending packet %#v: %w", packet, err)
		}
	}

	results, err := tx.Exec(ctx)
	if err != nil {
		return fmt.Errorf("redis error EXECing event post: %w", err)
	}
	if len(results) < 2 {
		return fmt.Errorf("redis error posting event, expected [1, **], got %v", results)
	}
	return nil
}

// DeleteEvent removes an event from a game and updates the game's connected players.
func DeleteEvent(ctx context.Context, client redis.Cmdable, gameID string, evt event.Event) error {
	eventID := evt.GetID()
	delete := update.ForEventDelete(eventID)
	packets := createOrDeletePackets(gameID, evt, delete)
	eventIDStr := fmt.Sprintf("%v", eventID)

	// MULTI: delete old event and publish update
	results, err := client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		pipe.ZRemRangeByScore(ctx, "history:"+gameID, eventIDStr, eventIDStr)
		for _, packet := range packets {
			if err := publishPacket(ctx, pipe, &packet); err != nil {
				return fmt.Errorf("publishing packet: %w", err)
			}
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("redis error sending event delete: %w", err)
	}
	if len(results) < 2 {
		return fmt.Errorf("redis error deleting event, expected [1, **], got %v", results)
	}
	return nil
}

// UpdateEventShare changes the sharing of an event
func UpdateEventShare(ctx context.Context, client redis.Cmdable, gameID string, evt event.Event, newShare event.Share) error {
	eventID := evt.GetID()
	if evt.GetShare() == newShare {
		return fmt.Errorf("event %s matches share %s", evt, newShare.String())
	}

	// Do the logic of figuring out how to send the minimum number of updates
	packets := sharePacketsModifyingEvent(gameID, evt, newShare)
	// Event now has new share, can be updated
	eventBytes, err := json.Marshal(evt)
	if err != nil {
		return fmt.Errorf("marshal event %#v to JSON: %w", evt, err)
	}

	tx := client.Pipeline()
	// From what I can tell, ZADD does not let you update an existing element
	// with the given score atomically. Since this is MULTI anyway, we delete
	// the old event and add the new one.
	// Ideally, we'd use ZDEL like we do in DeleteEvent() but I don't want the
	// old event as a parameter and this at least helps prevent event duplication.
	eventIDStr := fmt.Sprintf("%v", eventID)
	err = tx.ZRemRangeByScore(ctx, "history:"+gameID, eventIDStr, eventIDStr).Err()
	if err != nil {
		return fmt.Errorf("redis error sending event delete: %w", err)
	}
	err = tx.ZAddNX(ctx, "history:"+gameID,
		&redis.Z{Score: float64(eventID), Member: eventBytes}).Err()
	if err != nil {
		return fmt.Errorf("redis error sending event delete: %w", err)
	}
	for _, packet := range packets {
		err = publishPacket(ctx, client, &packet)
		if err != nil {
			return fmt.Errorf("sending packet %#v: %w", packet, err)
		}
	}

	// EXEC: [#deleted=1, #added=1, #players1, ...#players3]
	results, err := tx.Exec(ctx)
	if err != nil {
		return fmt.Errorf("redis error EXECing event post: %w", err)
	}
	if len(results) < 4 {
		return fmt.Errorf("redis error updating event share, expected [1, 1, **], got %v", results)
	}
	return nil
}

// UpdateEvent replaces an event in the database and notifies players of the change.
func UpdateEvent(ctx context.Context, client redis.Cmdable, gameID string, newEvent event.Event, update update.Event) error {
	channel := UpdateChannel(gameID, newEvent.GetPlayerID(), newEvent.GetShare())
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
	tx := client.Pipeline()
	if err != nil {
		return fmt.Errorf("redis error initializing event delete: %w", err)
	}
	// From what I can tell, ZADD does not let you update an existing element
	// with the given score atomically. Since this is MULTI anyway, we delete
	// the old event and add the new one.
	// Ideally, we'd use ZDEL like we do in DeleteEvent() but I don't want the
	// old event as a parameter and this at least helps prevent event duplication.
	eventIDStr := fmt.Sprintf("%v", eventID)
	err = tx.ZRemRangeByScore(ctx, "history:"+gameID, eventIDStr, eventIDStr).Err()
	if err != nil {
		return fmt.Errorf("redis error sending event delete: %w", err)
	}
	err = tx.ZAddNX(ctx, "history:"+gameID, &redis.Z{Score: float64(eventID), Member: eventBytes}).Err()
	if err != nil {
		return fmt.Errorf("redis error sending event delete: %w", err)
	}
	err = tx.Publish(ctx, channel, updateBytes).Err()
	if err != nil {
		return fmt.Errorf("redis error sending event publish: %w", err)
	}

	// EXEC: [#deleted=1, #added=1, #players]
	results, err := tx.Exec(ctx)
	if err != nil {
		return fmt.Errorf("redis error EXECing event post: %w", err)
	}
	if len(results) != 3 {
		return fmt.Errorf("redis error updating event, expected [1, 1, *], got %v", results)
	}
	return nil
}
