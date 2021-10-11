package game

import (
	"context"
	"encoding/json"

	"sr/id"
	srOtel "sr/otel"
	"sr/player"
	"sr/update"

	"github.com/go-redis/redis/v8"
)

// AddPlayer adds a player to a given game.
func AddPlayer(ctx context.Context, client redis.Cmdable, gameID string, player *player.Player) error {
	ctx, span := srOtel.Tracer.Start(ctx, "game.AddPlayer")
	defer span.End()
	updateBytes, err := json.Marshal(update.ForPlayerAdd(player))
	if err != nil {
		return srOtel.WithSetErrorf(span, "marshal update to JSON: %w", err)
	}

	var added *redis.IntCmd
	var published *redis.IntCmd
	_, err = client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		added = pipe.SAdd(ctx, "players:"+gameID, player.ID)
		published = pipe.Publish(ctx, "update:"+gameID, updateBytes)
		return nil
	})
	if err != nil {
		return srOtel.WithSetErrorf(span, "running transaction: %v", err)
	}

	if added, err := added.Result(); err != nil || added != 1 {
		return srOtel.WithSetErrorf(span, "adding to list: expected to add 1, got %v %v", added, err)
	}
	if err := published.Err(); err != nil {
		return srOtel.WithSetErrorf(span, "publishing: %w", err)
	}
	return nil
}

// UpdatePlayerConnections tracks a player's online status, and updates the game accordingly
func UpdatePlayerConnections(ctx context.Context, client redis.Cmdable, gameID string, playerID id.UID, mod int) (int64, error) {
	ctx, span := srOtel.Tracer.Start(ctx, "game.UpdatePlayerConnections")
	defer span.End()
	newConns, err := player.ModifyConnections(ctx, client, playerID, mod)
	if err != nil {
		return 0, srOtel.WithSetErrorf(span, "redis error updating connections for %v: %w", playerID, err)
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
		return newConns, nil
	}
	updateBytes, err := json.Marshal(ud)
	if err != nil {
		return newConns, srOtel.WithSetErrorf(span, "unable to marshal %#v to JSON: %w", ud, err)
	}
	if err = client.Publish(ctx, "update:"+gameID, updateBytes).Err(); err != nil {
		return newConns, srOtel.WithSetErrorf(span, "redis error publishing %#v: %w", ud, err)
	}
	return newConns, nil
}

// UpdatePlayer updates a player in the database.
// It does not allow for username updates. It only publishes the update to the given game.
func UpdatePlayer(ctx context.Context, client redis.Cmdable, gameID string, playerID id.UID, externalUpdate update.Player, internalUpdate update.Player) error {
	ctx, span := srOtel.Tracer.Start(ctx, "game.UpdatePlayer")
	defer span.End()
	if internalUpdate.IsEmpty() && externalUpdate.IsEmpty() {
		return srOtel.WithSetErrorf(span, "external update %v empty and internal update %v empty", externalUpdate, internalUpdate)
	}

	_, err := client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		if !internalUpdate.IsEmpty() {
			key, playerData, err := internalUpdate.MakeRedisCommand()
			if err != nil {
				return srOtel.WithSetErrorf(span, "serializing player data: %w", err)
			}
			// Apply update to player
			_ = pipe.HSet(ctx, key, playerData)
		}
		if !externalUpdate.IsEmpty() {
			updateBytes, err := json.Marshal(externalUpdate)
			if err != nil {
				return srOtel.WithSetErrorf(span, "unable to marshal update to JSON: %w", err)
			}
			_ = pipe.Publish(ctx, "update:"+gameID, updateBytes)
		}
		return nil
	})
	if err != nil {
		return srOtel.WithSetErrorf(span, "sending transaction: %w", err)
	}
	return nil
}
