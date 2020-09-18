package sr

import (
	"fmt"
	"github.com/gomodule/redigo/redis"
)

// GameExists returns whether the given game exists in Redis.
func GameExists(gameID string, conn redis.Conn) (bool, error) {
	return redis.Bool(conn.Do("exists", "game:"+gameID))
}

// GameInfo represents basic info about a game that the frontend would want
// by default, all at once.
type GameInfo struct {
	ID      string            `json:"id"`
	Players map[string]string `json:"players"`
}

// GetGameInfo retrieves `GameInfo` for the given GameID
func GetGameInfo(gameID string, conn redis.Conn) (GameInfo, error) {
	players, err := redis.StringMap(conn.Do("hgetall", "player:"+gameID))
	if err != nil {
		return GameInfo{}, err
	}
	return GameInfo{gameID, players}, nil
}

// AddNewPlayerToKnownGame is used at login to add a newly created player to
// a game. It does not verify the GameID.
func AddNewPlayerToKnownGame(
	session *Session,
	conn redis.Conn,
) (string, error) {
	_, err := conn.Do("hset", "player:"+session.GameID, session.PlayerID, session.PlayerName)
	if err != nil {
		return "", err
	}

	event := PlayerJoinEvent{
		EventCore: EventCore{
			ID:         NewEventID(),
			Type:       EventTypePlayerJoin,
			PlayerID:   session.PlayerID,
			PlayerName: session.PlayerName,
		},
	}
	err = PostEvent(session.GameID, &event, conn)
	if err != nil {
		return "", err
	}
	return "", nil
}

// RenamePlayer renames a player, also updating the session (object and in database)
func RenamePlayer(session *Session, newName string, conn redis.Conn) error {
	err := conn.Send("MULTI")
	if err != nil {
		return fmt.Errorf("Redis error sending MULTI: %w", err)
	}
	err = conn.Send("HSET", "player:"+session.GameID, session.PlayerID, newName)
	if err != nil {
		return fmt.Errorf("Redis error sending game HSET: %w", err)
	}
	err = conn.Send("HSET", session.redisKey(), "playerName", newName)
	if err != nil {
		return fmt.Errorf("Redis error sending session HSET: %w", err)
	}
	res, err := redis.Ints(conn.Do("EXEC"))
	if res[0] != 0 || res[1] != 0 {
		return fmt.Errorf("Expected result of rename to be [0 0], got %v", res)
	}
	session.PlayerName = newName
	return nil
}
