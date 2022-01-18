package game

import (
	"context"
	"encoding/json"
	"fmt"

	"shadowroller.net/libsr/config"
	"sr/event"
	"sr/id"
	"sr/log"
	"sr/player"
	"sr/update"

	"github.com/go-redis/redis/v8"
)

// PlayerCanSeeEvent determines if the given player can see the given event
func PlayerCanSeeEvent(plr *player.Player, isGM bool, evt event.Event) bool {
	share := evt.GetShare()
	if share == event.ShareInGame {
		return true
	}
	if share == event.SharePrivate {
		return evt.GetPlayerID() == plr.ID
	}
	if share == event.ShareGMs {
		return evt.GetPlayerID() == plr.ID || isGM
	}
	panic(fmt.Sprintf("unexpected share %v for event %v", share, evt))
}

// GameChannel is the Redis subscription to game-broadcast updates.
func GameChannel(gameID string) string {
	return "update:" + gameID
}

// PlayerChannel is the Redis subscription to player-sent updates.
func PlayerChannel(gameID string, playerID id.UID) string {
	return "update:" + gameID + ":" + string(playerID)
}

// GMsChannel is the Redis subscription to GM-sent updates.
func GMsChannel(gameID string) string {
	return "update:" + gameID + ":gms"
}

// UpdateChannel produces the channel an update should be posted in, and whether it may overlap.
func UpdateChannel(gameID string, playerID id.UID, share event.Share) string {
	if share == event.ShareInGame {
		return GameChannel(gameID)
	}
	if share == event.SharePrivate {
		return PlayerChannel(gameID, playerID)
	}
	if share == event.ShareGMs {
		return GMsChannel(gameID)
	}
	panic(fmt.Sprintf("unexpected share %v for player %v in %v",
		share, playerID, gameID,
	))
}

func gameOrGMsChannel(gameID string, share event.Share) string {
	if share == event.ShareInGame {
		return GameChannel(gameID)
	}
	if share == event.ShareGMs {
		return GMsChannel(gameID)
	}
	panic(fmt.Sprintf("gameOrGMsChannel called with invalid share %v", share))
}

// Packet encapsulates that an update is being sent across multiple
// channels, with some filtering to avoid multiple received messages.
type Packet struct {
	Channel string        // Redis pub/sub channel to send.
	Filter  []string      // Filters to apply in the channel.
	Update  update.Update // Update to be sent.
}

func publishPacket(ctx context.Context, client redis.Cmdable, packet *Packet) error {
	ud := packet.Update
	var updateBytes []byte
	var err error
	if len(packet.Filter) > 0 {
		var updateStr string
		filtered := update.WithFilters(packet.Filter, ud)
		ud = filtered
		updateStr, err = filtered.Serialize()
		updateBytes = []byte(updateStr)
	} else {
		updateBytes, err = json.Marshal(ud)
	}
	if err != nil {
		return fmt.Errorf("unable to marshal update %#v to json: %w", ud, err)
	}
	err = client.Publish(ctx, packet.Channel, updateBytes).Err()
	if err != nil {
		return fmt.Errorf("redis error sending PUBLISH: %w", err)
	}
	if config.UpdatesDebug {
		log.Printf(ctx,
			"Update: publish %v to %v filter %v",
			ud.Type(), packet.Channel, packet.Filter,
		)
	}
	return nil
}

// createOrDeletePackets returns the {channel, filter, update} trios for an event create or delete.
// If an event is created/deleted shared with GMs, two pakcets are needed.
func createOrDeletePackets(gameID string, evt event.Event, update update.Event) []Packet {
	share := evt.GetShare()
	playerID := evt.GetPlayerID()

	if share == event.ShareInGame {
		return []Packet{{GameChannel(gameID), []string{}, update}}
	} else if share == event.SharePrivate {
		return []Packet{{PlayerChannel(gameID, playerID), []string{}, update}}
	} else if share == event.ShareGMs {
		return []Packet{
			{GMsChannel(gameID), []string{string(playerID)}, update},
			{PlayerChannel(gameID, playerID), []string{}, update},
		}
	} else {
		panic(fmt.Sprintf("unexpected update share %v for %v update %v in %v",
			share, evt, update, gameID,
		))
	}
}

// GetSharePacketsModifyingEvent returns the {channel, filter, update} trios
// which should be sent to a game when an event share is changed.
// It calls event.SetShare on the given evt.
func sharePacketsModifyingEvent(gameID string, evt event.Event, newShare event.Share) []Packet {
	oldShare := evt.GetShare()
	evt.SetShare(newShare)

	playerID := evt.GetPlayerID()
	modify := update.ForEventShare(evt, newShare)
	create := update.ForNewEvent(evt)
	delete := update.ForEventDelete(evt.GetID())

	if /* oldShare in GMs, Game && */ newShare == event.SharePrivate {
		// {game/gms} -> private:
		// = {game/gms}-player delete; player modify
		return []Packet{
			// 1. {game/gms}-player delete
			{gameOrGMsChannel(gameID, oldShare), []string{string(playerID)}, delete},
			// 2. player modify
			{PlayerChannel(gameID, evt.GetPlayerID()), []string{}, modify},
		}
	} else if oldShare == event.SharePrivate /* && newShare in GMs, Game */ {
		// private -> {game/gms}:
		// = {game/gms}-player create; player modify
		return []Packet{
			// 1. {game/gms}-player create
			{gameOrGMsChannel(gameID, newShare), []string{string(playerID)}, create},
			// 2. player modify
			{PlayerChannel(gameID, playerID), []string{}, modify},
		}
	} else if oldShare == event.ShareGMs && newShare == event.ShareInGame {
		// gms -> game:
		// = gms-player modify; player modify; game-player-gms create
		return []Packet{
			// 1. gms-player modify
			{GMsChannel(gameID), []string{string(playerID)}, modify},
			// 2. player modify
			{PlayerChannel(gameID, playerID), []string{}, modify},
			// 3. game-player-gms create
			{GameChannel(gameID), []string{string(playerID), "gms"}, create},
		}
	} else if oldShare == event.ShareInGame && newShare == event.ShareGMs {
		// game -> gms:
		// = game-gms-player delete; gms-player modify; player modify
		return []Packet{
			// 1. game-gms-player delete
			{GameChannel(gameID), []string{"gms", string(playerID)}, delete},
			// 2. gms-player modify
			{GMsChannel(gameID), []string{string(playerID)}, modify},
			// 3. player modify
			{PlayerChannel(gameID, playerID), []string{}, modify},
		}
	}
	panic(fmt.Sprintf("unexpected new share %v for event %v", newShare, evt))
}
