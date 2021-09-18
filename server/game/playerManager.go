package game

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sr/id"
	"sr/player"
	"sr/update"

	"github.com/go-redis/redis/v8"
)

// AddPlayer adds a player to a given game.
func AddPlayer(ctx context.Context, client redis.Cmdable, gameID string, player *player.Player) error {
	updateBytes, err := json.Marshal(update.ForPlayerAdd(player))
	if err != nil {
		return fmt.Errorf("marshal update to JSON: %w", err)
	}

	var added *redis.IntCmd
	var published *redis.IntCmd
	_, err = client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		added = pipe.SAdd(ctx, "players:"+gameID, player.ID)
		published = pipe.Publish(ctx, "update:"+gameID, updateBytes)
		return nil
	})
	if err != nil {
		return fmt.Errorf("running transaction: %v", err)
	}

	if added, err := added.Result(); err != nil || added != 1 {
		return fmt.Errorf("adding to list: expected to add 1, got %v %v", added, err)
	}
	if err := published.Err(); err != nil {
		return fmt.Errorf("publishing: %w", err)
	}
	return nil
}

// UpdatePlayerConnections tracks a player's online status, and updates the game accordingly
func UpdatePlayerConnections(ctx context.Context, client redis.Cmdable, gameID string, playerID id.UID, mod int) (int64, error) {
	newConns, err := player.ModifyConnections(ctx, client, playerID, mod)
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
	if err = client.Publish(ctx, "update:"+gameID, updateBytes).Err(); err != nil {
		return newConns, fmt.Errorf("redis error publishing %#v: %w", ud, err)
	}
	return newConns, nil
}

// UpdatePlayer updates a player in the database.
// It does not allow for username updates. It only publishes the update to the given game.
func UpdatePlayer(ctx context.Context, client redis.Cmdable, gameID string, playerID id.UID, externalUpdate update.Player, internalUpdate update.Player) error {
	if internalUpdate.IsEmpty() && externalUpdate.IsEmpty() {
		return fmt.Errorf("external update %v empty and internal update %v empty", externalUpdate, internalUpdate)
	}

	_, err := client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		if !internalUpdate.IsEmpty() {
			playerSet, playerData := internalUpdate.MakeRedisCommand()
			// Apply update to player
			_ = pipe.Do(ctx, playerSet, playerData)
		}
		if !externalUpdate.IsEmpty() {
			updateBytes, err := json.Marshal(externalUpdate)
			if err != nil {
				return fmt.Errorf("unable to marshal update to JSON: %w", err)
			}
			_ = pipe.Publish(ctx, "update:"+gameID, updateBytes)
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("sending transaction: %w", err)
	}
	return nil
}
