package game

import (
	"encoding/json"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"sr/id"
	"sr/player"
	"sr/update"
)

// AddPlayer adds an existing player to a specific game
func AddPlayer(gameID string, player *player.Player, conn redis.Conn) error {
	updateBytes, err := json.Marshal(update.ForPlayerAdd(player))
	if err != nil {
		return fmt.Errorf("marshal update to JSON: %w", err)
	}
	// MULTI: create player, publish update
	if err = conn.Send("MULTI"); err != nil {
		return fmt.Errorf("sending MULTI for player update: %w", err)
	}
	// Update game player list
	if err = conn.Send("SADD", "players:"+gameID, player.ID); err != nil {
		return fmt.Errorf("sending SADD for player update: %w", err)
	}
	// Send update
	if err = conn.Send("PUBLISH", "update:"+gameID, updateBytes); err != nil {
		return fmt.Errorf("sending PUBLISH for player update; %w", err)
	}
	// EXEC: [#added=1, #updated]
	results, err := redis.Ints(conn.Do("EXEC"))
	if err != nil {
		return fmt.Errorf("redis error sending EXEC: %w", err)
	}
	if len(results) != 2 || results[0] != 1 {
		return fmt.Errorf(
			"redis invalid adding %v to %v: expected [1, *], got %v",
			player, gameID, results,
		)
	}
	return nil
}

// UpdatePlayer updates a player in the database.
// It does not allow for username updates. It only publishes the update to the given game.
func UpdatePlayer(gameID string, playerID id.UID, update update.Player, conn redis.Conn) error {
	playerSet, playerData := update.MakeRedisCommand()
	updateBytes, err := json.Marshal(update)
	if err != nil {
		return fmt.Errorf("unable to marshal update to JSON :%w", err)
	}

	// MULTI: update player, publish update
	if err := conn.Send("MULTI"); err != nil {
		return fmt.Errorf("redis error sending MULTI for player update: %w", err)
	}
	// Apply update to player
	if err = conn.Send(playerSet, playerData...); err != nil {
		return fmt.Errorf("redis error sending HSET for player update: %w", err)
	}
	if err = conn.Send("PUBLISH", "update:"+gameID, updateBytes); err != nil {
		return fmt.Errorf("redis error sending event publish: %w", err)
	}
	// EXEC: [#new=0, #players]
	results, err := redis.Ints(conn.Do("EXEC"))
	if err != nil {
		return fmt.Errorf("redis error sending EXEC: %w", err)
	}
	if len(results) != 2 {
		return fmt.Errorf("redis error updating player, expected 2 results got %v", results)
	}
	if results[0] != 0 {
		return fmt.Errorf("redis error updating player, expected [0, *] got %v", results)
	}
	return nil
}
