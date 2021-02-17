package game

import (
	"encoding/json"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"log"
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

func UpdatePlayerConnections(gameID string, playerID id.UID, mod int, conn redis.Conn) (int, error) {
	newConns, err := player.ModifyConnections(playerID, mod, conn)
	if err != nil {
		return 0, fmt.Errorf("redis error updating connections for %v: %w", playerID, err)
	}
	// Race conditions
	// - We assume that for each incr we will eventually send a decr.
	// - We assume we have not sent a decr without having sent an incr.
	// - Redis incr and decr are atomic, so we assume the sends will go through.
	// - We DO NOT assume the sends will go through in order.
	// - We assume the connection MAY drop below 0 if decrs are processed before incrs.
	// We assume this may only happen in a sceario where an incrs will come through later
	// and match the decrs; i.e. if we have observed connections < 0 we expect to settle on
	// connections = 0. Because of this, we do not send updates for connections < 0.
	var ud update.Player
	// Decreasd to 0; going offline
	if newConns == 0 && mod == player.DecreaseConnections {
		ud = update.ForPlayerOnline(playerID, false)
	} else if newConns == 1 && mod == player.IncreaseConnections {
		ud = update.ForPlayerOnline(playerID, true)
	} else {
		log.Printf("Mod = %v, connections = %v, not sending an update", mod, newConns)
		return newConns, nil
	}
	updateBytes, err := json.Marshal(ud)
	if err != nil {
		return newConns, fmt.Errorf("unable to marshal %#v to JSON: %w", ud, err)
	}
	if _, err = conn.Do("PUBLISH", "update:"+gameID, updateBytes); err != nil {
		return newConns, fmt.Errorf("redis error publishing %#v: %w", ud, err)
	}
	return newConns, nil
}

// UpdatePlayer updates a player in the database.
// It does not allow for username updates. It only publishes the update to the given game.
func UpdatePlayer(gameID string, playerID id.UID, externalUpdate update.Player, internalUpdate update.Player, conn redis.Conn) error {
	if internalUpdate.IsEmpty() && externalUpdate.IsEmpty() {
		return fmt.Errorf("external update %v empty and internal update %v empty", externalUpdate, internalUpdate)
	}
	// MULTI: update player, publish update
	if err := conn.Send("MULTI"); err != nil {
		return fmt.Errorf("redis error sending MULTI for player update: %w", err)
	}
	if !internalUpdate.IsEmpty() {
		playerSet, playerData := internalUpdate.MakeRedisCommand()
		// Apply update to player
		if err := conn.Send(playerSet, playerData...); err != nil {
			return fmt.Errorf("redis error sending HSET for player update: %w", err)
		}
	}
	if !externalUpdate.IsEmpty() {
		updateBytes, err := json.Marshal(externalUpdate)
		if err != nil {
			return fmt.Errorf("unable to marshal update to JSON :%w", err)
		}
		if err = conn.Send("PUBLISH", "update:"+gameID, updateBytes); err != nil {
			return fmt.Errorf("redis error sending event publish: %w", err)
		}
	}
	// EXEC: [0] for just internal, [#players] for just external, [#new=0, #players] for both
	_, err := redis.Ints(conn.Do("EXEC"))
	if err != nil {
		return fmt.Errorf("redis error sending EXEC: %w", err)
	}
	return nil
}
