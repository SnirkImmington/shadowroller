package update

import (
	"encoding/json"
	"github.com/gomodule/redigo/redis"
	"sr/id"
	"sr/player"
)

// Player is an update for players changing
type Player interface {
	Update

	PlayerID() id.UID
	MakeRedisCommand() (string, redis.Args)
	IsEmpty() bool
}

type PlayerOnline struct {
	id     id.UID
	online bool
}

func (update *PlayerOnline) MakeRedisCommand() (string, redis.Args) {
	panic("MakeRedisCommand called on update.PlayerOnline")
}

func (update *PlayerOnline) Type() string {
	return UpdateTypePlayer
}

func (update *PlayerOnline) PlayerID() id.UID {
	return update.id
}

func (update *PlayerOnline) IsEmpty() bool {
	return false
}

func (update *PlayerOnline) MarshalJSON() ([]byte, error) {
	diff := make(map[string]bool, 1)
	diff["online"] = update.online
	return json.Marshal([]interface{}{
		UpdateTypePlayer, update.id, diff,
	})
}

func ForPlayerOnline(playerID id.UID, online bool) Player {
	return &PlayerOnline{id: playerID, online: online}
}

type playerDiff struct {
	id   id.UID
	diff map[string]interface{}
}

func (update *playerDiff) MakeRedisCommand() (string, redis.Args) {
	return "HSET", redis.Args{}.Add("player:" + update.id).AddFlat(update.diff)
}

func (update *playerDiff) Type() string {
	return UpdateTypePlayer
}

func (update *playerDiff) PlayerID() id.UID {
	return update.id
}

func (update *playerDiff) IsEmpty() bool {
	return len(update.diff) == 0
}

func (update *playerDiff) MarshalJSON() ([]byte, error) {
	fields := []interface{}{
		UpdateTypePlayer, update.id, update.diff,
	}
	return json.Marshal(fields)
}

// ForPlayerDiff constructs an update for a player's info changing
func ForPlayerDiff(playerID id.UID, diff map[string]interface{}) Player {
	return &playerDiff{
		id:   playerID,
		diff: diff,
	}
}

type playerAdd struct {
	player *player.Player
}

func (update *playerAdd) Type() string {
	return UpdateTypePlayer
}

func (update *playerAdd) PlayerID() id.UID {
	return update.player.ID
}

func (update *playerAdd) IsEmpty() bool {
	return false
}

func (update *playerAdd) MarshalJSON() ([]byte, error) {
	fields := []interface{}{UpdateTypePlayer, "add", update.player.Info()}
	return json.Marshal(fields)
}

func (update *playerAdd) MakeRedisCommand() (string, redis.Args) {
	return "HSET", redis.Args{}.
		Add("player:" + update.player.ID).
		AddFlat(update.player)
}

// ForPlayerAdd constructs an update for adding a player to a game
func ForPlayerAdd(player *player.Player) Player {
	return &playerAdd{player}
}
