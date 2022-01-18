package update

import (
	"encoding/json"
	"fmt"

	"sr/id"
	"sr/player"
	redisUtil "shadowroller.net/libsr/redis"
)

// Player is an update for properties of a player changing.
type Player interface {
	Update

	PlayerID() id.UID                                          // ID of the player being updated
	MakeRedisCommand() (string, map[string]interface{}, error) // For updating redis...
	IsEmpty() bool                                             // If a diff update was created empty
}

type playerOnline struct {
	id     id.UID
	online bool
}

func (update *playerOnline) MakeRedisCommand() (string, map[string]interface{}, error) {
	return "", nil, fmt.Errorf("cannot call MakeRedisCommand on playerOnline.")
}

func (update *playerOnline) Type() string {
	return TypePlayerMod
}

func (update *playerOnline) PlayerID() id.UID {
	return update.id
}

func (update *playerOnline) IsEmpty() bool {
	return false
}

func (update *playerOnline) MarshalJSON() ([]byte, error) {
	diff := make(map[string]bool, 1)
	diff["online"] = update.online
	return json.Marshal([]interface{}{
		TypePlayerMod, update.id, diff,
	})
}

func ForPlayerOnline(playerID id.UID, online bool) Player {
	return &playerOnline{id: playerID, online: online}
}

type playerDiff struct {
	id   id.UID
	diff map[string]interface{}
}

func (update *playerDiff) MakeRedisCommand() (string, map[string]interface{}, error) {
	return "player:" + string(update.id), update.diff, nil
}

func (update *playerDiff) Type() string {
	return TypePlayerMod
}

func (update *playerDiff) PlayerID() id.UID {
	return update.id
}

func (update *playerDiff) IsEmpty() bool {
	return len(update.diff) == 0
}

func (update *playerDiff) MarshalJSON() ([]byte, error) {
	fields := []interface{}{TypePlayerMod, update.id, update.diff}
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
	return TypePlayerAdd
}

func (update *playerAdd) PlayerID() id.UID {
	return update.player.ID
}

func (update *playerAdd) IsEmpty() bool {
	return false
}

func (update *playerAdd) MarshalJSON() ([]byte, error) {
	fields := []interface{}{TypePlayerAdd, update.player.Info()}
	return json.Marshal(fields)
}

func (update *playerAdd) MakeRedisCommand() (string, map[string]interface{}, error) {
	mapped, err := redisUtil.StructToStringMap(update.player)
	if err != nil {
		return "", nil, fmt.Errorf("converting update player: %w", err)
	}
	ifaceMapped := make(map[string]interface{}, len(mapped))
	for key, val := range mapped {
		ifaceMapped[key] = val
	}
	return "player:" + string(update.player.ID), ifaceMapped, err
}

// ForPlayerAdd constructs an update for adding a player to a game
func ForPlayerAdd(player *player.Player) Player {
	return &playerAdd{player}
}
