package game

import (
	"errors"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"sr/config"
	"sr/id"
	"sr/player"
)

// ErrNotFound means that a specified game does not exists
var ErrNotFound = errors.New("game not found")

// ErrTransactionAborted means that a transaction was aborted and should be retried
var ErrTransactionAborted = errors.New("transaction aborted")

// Exists returns whether the given game exists in Redis.
func Exists(gameID string, conn redis.Conn) (bool, error) {
	return redis.Bool(conn.Do("exists", "game:"+gameID))
}

func HasGM(gameID string, playerID id.UID, conn redis.Conn) (bool, error) {
	return redis.Bool(conn.Do("sismember", "gm:"+gameID, string(playerID)))
}

// GetGMs returns the list of GMs from a game.
func GetGMs(gameID string, conn redis.Conn) ([]string, error) {
	return redis.Strings(conn.Do("smembers", "gm:"+gameID))
}

// IsGM is string array contains
func IsGM(gms []string, playerID id.UID) bool {
	for _, gmID := range gms {
		if gmID == string(playerID) {
			return true
		}
	}
	return false
}

func IsGMOf(game *Info, playerID id.UID) bool {
	return IsGM(game.GMs, playerID)
}

// GetPlayersIn retrieves the list of players in a game.
// Returns ErrNotFound if the game is not found OR if it has no players.
func GetPlayersIn(gameID string, conn redis.Conn) ([]player.Player, error) {
	getPlayerMaps := func() ([]string, []interface{}, error) {
		if _, err := conn.Do("WATCH", "players:"+gameID); err != nil {
			return nil, nil, fmt.Errorf("redis error sending `WATCH`: %w", err)
		}
		playerIDs, err := redis.Strings(conn.Do("SMEMBERS", "players:"+gameID))
		if err != nil {
			return nil, nil, fmt.Errorf("redis error retrieving player ID list: %w", err)
		}
		if playerIDs == nil || len(playerIDs) == 0 {
			if _, err := conn.Do("UNWATCH"); err != nil {
				return nil, nil, fmt.Errorf("redis error sending `UNWATCH`: %w", err)
			}
			return nil, nil, fmt.Errorf("%w: %v has no players", ErrNotFound, gameID)
		}

		if err = conn.Send("MULTI"); err != nil {
			return nil, nil, fmt.Errorf("redis error sending MULTI: %w", err)
		}
		for _, playerID := range playerIDs {
			if err = conn.Send("HGETALL", "player:"+playerID); err != nil {
				return nil, nil, fmt.Errorf("redis error sending HGETALL %v: %w", playerID, err)
			}
		}

		playerMaps, err := redis.Values(conn.Do("EXEC"))
		if err != nil {
			return nil, nil, fmt.Errorf("redis error sending EXEC: %w", err)
		}
		if playerMaps == nil || len(playerMaps) == 0 {
			return nil, nil, ErrTransactionAborted
		}
		if len(playerMaps) < len(playerIDs) {
			return nil, nil, fmt.Errorf(
				"insufficient list of players in %v for meaningful response: %v",
				gameID, playerMaps,
			)
		}
		return playerIDs, playerMaps, nil
	}
	var err error
	var playerIDs []string
	var playerMaps []interface{}
	for i := 0; i < config.RedisRetries; i++ {
		playerIDs, playerMaps, err = getPlayerMaps()
		if errors.Is(err, ErrTransactionAborted) {
			continue
		} else if errors.Is(err, ErrNotFound) {
			return nil, err
		} else if err != nil {
			return nil, fmt.Errorf("after %v attempt(s): %w", i+1, err)
		}
		break
	}
	if err != nil {
		return nil, fmt.Errorf("after max attempts: %w", err)
	}

	players := make([]player.Player, len(playerMaps))
	for i, playerMap := range playerMaps {
		err = redis.ScanStruct(playerMap.([]interface{}), &players[i])
		players[i].ID = id.UID(playerIDs[i])
		if err != nil {
			return nil, fmt.Errorf(
				"redis error parsing #%v #%v: %w",
				i, playerIDs[i], err,
			)
		}
		if players[i].Username == "" {
			return nil, fmt.Errorf(
				"no data for %v player #%v %v after redis parse: %v",
				gameID, i, playerIDs[i], playerMap,
			)
		}
	}
	return players, nil
}

// Info represents basic info about a game that the frontend would want
// by default, all at once.
type Info struct {
	ID      string                 `json:"id"`
	Players map[string]player.Info `json:"players"`
	GMs     []string               `json:"gms"`
}

// GetInfo retrieves `Info` for the given ID
func GetInfo(gameID string, conn redis.Conn) (*Info, error) {
	players, err := GetPlayersIn(gameID, conn)
	if err != nil {
		return nil, fmt.Errorf("error getting players in game %v: %w", gameID, err)
	}
	gms, err := GetGMs(gameID, conn)
	if err != nil {
		return nil, fmt.Errorf("error getting GMs in game %v: %w", gameID, err)
	}
	info := make(map[string]player.Info, len(players))
	for _, player := range players {
		info[string(player.ID)] = player.Info()
	}
	return &Info{ID: gameID, Players: info, GMs: gms}, nil
}
