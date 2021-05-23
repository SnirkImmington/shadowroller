package game

import (
	"encoding/json"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"sr/event"
	"sr/update"
)

// PostEvent adds an event to redis, sending an update for non-private events.
func PostEvent(gameID string, evt event.Event, conn redis.Conn) error {
	eventBytes, err := json.Marshal(evt)
	if err != nil {
		return fmt.Errorf("marshaling event to JSON: %w", err)
	}

	create := update.ForNewEvent(evt)
	packets := createOrDeletePackets(gameID, evt, create)

	err = conn.Send("MULTI")
	if err != nil {
		return fmt.Errorf("redis error initiating event post: %w", err)
	}
	err = conn.Send("ZADD", "history:"+gameID, "NX", evt.GetID(), eventBytes)
	if err != nil {
		return fmt.Errorf("redis error sending add event to history: %w", err)
	}
	for _, packet := range packets {
		err = publishPacket(&packet, conn)
		if err != nil {
			return fmt.Errorf("sending packet %#v: %w", packet, err)
		}
	}

	results, err := redis.Ints(conn.Do("EXEC"))
	if err != nil {
		return fmt.Errorf("redis error EXECing event post: %w", err)
	}
	if len(results) < 2 || results[0] != 1 {
		return fmt.Errorf("redis error posting event, expected [1, **], got %v", results)
	}
	return nil
}

// DeleteEvent removes an event from a game and updates the game's connected players.
func DeleteEvent(gameID string, evt event.Event, conn redis.Conn) error {
	eventID := evt.GetID()
	delete := update.ForEventDelete(eventID)
	packets := createOrDeletePackets(gameID, evt, delete)

	// MULTI: delete old event and publish update
	err := conn.Send("MULTI")
	if err != nil {
		return fmt.Errorf("redis error initializing event delete: %w", err)
	}
	err = conn.Send("ZREMRANGEBYSCORE", "history:"+gameID, eventID, eventID)
	if err != nil {
		return fmt.Errorf("redis error sending event delete: %w", err)
	}
	for _, packet := range packets {
		err = publishPacket(&packet, conn)
		if err != nil {
			return fmt.Errorf("sending packet %#v: %w", packet, err)
		}
	}

	// EXEC: [#deleted=1, #updated]
	results, err := redis.Ints(conn.Do("EXEC"))
	if err != nil {
		return fmt.Errorf("redis error EXECing event post: %w", err)
	}
	if len(results) < 2 || results[0] != 1 {
		return fmt.Errorf("redis error deleting event, expected [1, **], got %v", results)
	}
	return nil
}

// UpdateEventShare changes the sharing of an event
func UpdateEventShare(gameID string, evt event.Event, newShare event.Share, conn redis.Conn) error {
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

	conn.Send("MULTI")
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
	for _, packet := range packets {
		err = publishPacket(&packet, conn)
		if err != nil {
			return fmt.Errorf("sending packet %#v: %w", packet, err)
		}
	}

	// EXEC: [#deleted=1, #added=1, #players1, ...#players3]
	results, err := redis.Ints(conn.Do("EXEC"))
	if err != nil {
		return fmt.Errorf("redis error EXECing event post: %w", err)
	}
	if len(results) < 4 || results[0] != 1 || results[1] != 1 {
		return fmt.Errorf("redis error updating event share, expected [1, 1, **], got %v", results)
	}
	return nil
}

// UpdateEvent replaces an event in the database and notifies players of the change.
func UpdateEvent(gameID string, newEvent event.Event, update update.Event, conn redis.Conn) error {
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
