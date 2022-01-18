package game

import (
	"context"
	"encoding/json"
	"fmt"

	"sr/event"
	srOtel "shadowroller.net/libsr/otel"
	"sr/update"

	"github.com/go-redis/redis/v8"
)

// PostEvent adds an event to redis, sending an update for non-private events.
func PostEvent(ctx context.Context, client redis.Cmdable, gameID string, evt event.Event) error {
	ctx, span := srOtel.Tracer.Start(ctx, "game.PostEvent")
	defer span.End()
	eventBytes, err := json.Marshal(evt)
	if err != nil {
		return srOtel.WithSetErrorf(span, "marshaling %v event %v: %w", evt.GetType(), evt.GetID(), err)
	}

	create := update.ForNewEvent(evt)
	packets := createOrDeletePackets(gameID, evt, create)

	results, err := client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		if err := pipe.ZAddNX(ctx, "history:"+gameID, &redis.Z{Score: float64(evt.GetID()), Member: eventBytes}).Err(); err != nil {
			return srOtel.WithSetErrorf(span, "sending history add: %w", err)
		}
		for ix, packet := range packets {
			err = publishPacket(ctx, pipe, &packet)
			if err != nil {
				return srOtel.WithSetErrorf(span, "sending packet #%v %#v: %w", ix, packet, err)
			}
		}
		return nil
	})
	if err != nil {
		return srOtel.WithSetErrorf(span, "running pipeline: %w", err)
	}
	if len(results) < 2 {
		return srOtel.WithSetErrorf(span, "posting event, expected [1, **], got %v", results)
	}
	return nil
}

// DeleteEvent removes an event from a game and updates the game's connected players.
func DeleteEvent(ctx context.Context, client redis.Cmdable, gameID string, evt event.Event) error {
	ctx, span := srOtel.Tracer.Start(ctx, "game.DeleteEvent")
	defer span.End()
	eventID := evt.GetID()
	delete := update.ForEventDelete(eventID)
	packets := createOrDeletePackets(gameID, evt, delete)
	eventIDStr := fmt.Sprintf("%v", eventID)

	// MULTI: delete old event and publish update
	results, err := client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		if err := pipe.ZRemRangeByScore(ctx, "history:"+gameID, eventIDStr, eventIDStr).Err(); err != nil {
			return srOtel.WithSetErrorf(span, "sending remrangebyscore: %w", err)
		}
		for _, packet := range packets {
			if err := publishPacket(ctx, pipe, &packet); err != nil {
				return srOtel.WithSetErrorf(span, "publishing packet: %w", err)
			}
		}
		return nil
	})
	if err != nil {
		return srOtel.WithSetErrorf(span, "redis error sending event delete: %w", err)
	}
	if len(results) < 2 {
		return srOtel.WithSetErrorf(span, "redis error deleting event, expected [1, **], got %v", results)
	}
	return nil
}

// UpdateEventShare changes the sharing of an event
func UpdateEventShare(ctx context.Context, client redis.Cmdable, gameID string, evt event.Event, newShare event.Share) error {
	ctx, span := srOtel.Tracer.Start(ctx, "game.UpdateEventShare")
	defer span.End()
	eventID := evt.GetID()
	if evt.GetShare() == newShare {
		return srOtel.WithSetErrorf(span, "share matches: event %v share %v matches new share %s", evt.GetID(), evt.GetShare().String(), newShare.String())
	}

	// Do the logic of figuring out how to send the minimum number of updates
	packets := sharePacketsModifyingEvent(gameID, evt, newShare)
	// Event now has new share, can be updated
	eventBytes, err := json.Marshal(evt)
	if err != nil {
		return srOtel.WithSetErrorf(span, "marshal event %#v to JSON: %w", evt, err)
	}
	eventIDStr := fmt.Sprintf("%v", eventID)

	results, err := client.Pipelined(ctx, func(pipe redis.Pipeliner) error {
		// From what I can tell, ZADD does not let you update an existing element
		// with the given score atomically. Since this is MULTI anyway, we delete
		// the old event and add the new one.
		// Ideally, we'd use ZDEL like we do in DeleteEvent() but I don't want the
		// old event as a parameter and this at least helps prevent event duplication.
		if err := pipe.ZRemRangeByScore(ctx, "history:"+gameID, eventIDStr, eventIDStr).Err(); err != nil {
			return srOtel.WithSetErrorf(span, "redis error sending event delete: %w", err)
		}
		if err := pipe.ZAddNX(ctx, "history:"+gameID, &redis.Z{Score: float64(eventID), Member: eventBytes}).Err(); err != nil {
			return srOtel.WithSetErrorf(span, "redis error sending event delete: %w", err)
		}
		for _, packet := range packets {
			err := publishPacket(ctx, pipe, &packet)
			if err != nil {
				return srOtel.WithSetErrorf(span, "sending packet %#v: %w", packet, err)
			}
		}
		return nil
	})

	// EXEC: [#deleted=1, #added=1, #players1, ...#players3]
	if err != nil {
		return srOtel.WithSetErrorf(span, "ececing event post: %w", err)
	}
	if len(results) < 4 {
		return srOtel.WithSetErrorf(span, "updating event share, expected [1, 1, **], got %v", results)
	}
	return nil
}

// UpdateEvent replaces an event in the database and notifies players of the change.
func UpdateEvent(ctx context.Context, client redis.Cmdable, gameID string, newEvent event.Event, update update.Event) error {
	ctx, span := srOtel.Tracer.Start(ctx, "game.UpdateEvent")
	defer span.End()
	channel := UpdateChannel(gameID, newEvent.GetPlayerID(), newEvent.GetShare())
	eventID := newEvent.GetID()
	eventBytes, err := json.Marshal(newEvent)
	if err != nil {
		return srOtel.WithSetErrorf(span, "unable to marshal event to JSON: %w", err)
	}
	updateBytes, err := json.Marshal(update)
	if err != nil {
		return srOtel.WithSetErrorf(span, "unable to marshal update to JSON: %w", err)
	}
	eventIDStr := fmt.Sprintf("%v", eventID)

	results, err := client.Pipelined(ctx, func(pipe redis.Pipeliner) error {
		// From what I can tell, ZADD does not let you update an existing element
		// with the given score atomically. Since this is MULTI anyway, we delete
		// the old event and add the new one.
		// Ideally, we'd use ZDEL like we do in DeleteEvent() but I don't want the
		// old event as a parameter and this at least helps prevent event duplication.
		err = pipe.ZRemRangeByScore(ctx, "history:"+gameID, eventIDStr, eventIDStr).Err()
		if err != nil {
			return srOtel.WithSetErrorf(span, "redis error sending event delete: %w", err)
		}
		err = pipe.ZAddNX(ctx, "history:"+gameID, &redis.Z{Score: float64(eventID), Member: eventBytes}).Err()
		if err != nil {
			return srOtel.WithSetErrorf(span, "redis error sending event delete: %w", err)
		}
		err = pipe.Publish(ctx, channel, updateBytes).Err()
		if err != nil {
			return srOtel.WithSetErrorf(span, "redis error sending event publish: %w", err)
		}
		return nil
	})

	// EXEC: [#deleted=1, #added=1, #players]
	if err != nil {
		return srOtel.WithSetErrorf(span, "redis error EXECing event post: %w", err)
	}
	if len(results) != 3 {
		return srOtel.WithSetErrorf(span, "redis error updating event, expected [1, 1, *], got %v", results)
	}
	return nil
}
