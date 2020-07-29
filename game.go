package sr

import (
	"github.com/gomodule/redigo/redis"
)

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
		EventCore:  EventCore{Type: "playerJoin"},
		PlayerID:   string(session.PlayerID),
		PlayerName: session.PlayerName,
	}
	newestEventID, err := PostEvent(session.GameID, event, conn)
	if err != nil {
		return "", err
	}
	return newestEventID, nil
}
