package srserver

import (
	"github.com/gomodule/redigo/redis"
	"io"
	"net/http"
)

type GameJoinRequest struct {
	GameId     string `json:"game_id"`
	PlayerName string `json:"player_name"`
}

type Game struct {
	GameId string `json:"game_id"`
}

func gameExists(gameId string, conn redis.Conn) (bool, error) {
	isMember, err := redis.Int(conn.Do("sismember", "game_ids", gameId))
	if err != nil {
		return false, err
	}
	return isMember != 0, nil
}

func gameContainsPlayer(gameId string, playerName string, conn redis.Conn) (bool, error) {
	isMember, err := redis.Int(conn.Do("sismember", "game_players:"+gameId, playerName))
	if err != nil {
		return false, err
	}
	return isMember != 0, nil
}

func handleThrowAnError(response Response, request *Request) {
	panic("o shit")
}

// POST join-game { id = game_id, name = player_name }
func handleJoinGame(response Response, request *Request, conn redis.Conn) {
	// This needs to be a post
	if request.Method != http.MethodPost {
		http.Error(response, "use Post", http.StatusBadRequest)
		return
	}

	var gameJoinRequest GameJoinRequest
	err := readBodyJson(request, &gameJoinRequest)
	if err != nil {
		http.Error(response, "Invalid request", http.StatusBadRequest)
		return
	}

	exists, err := gameExists(gameJoinRequest.GameId, conn)
	if err != nil {
		httpError(response, request, err)
		return
	}
	if !exists {
		// This should be programmatic
		http.Error(response, "No game found", http.StatusNotFound)
		return
	}

	containsPlayer, err := gameContainsPlayer(gameJoinRequest.GameId, gameJoinRequest.PlayerName, conn)
	if err != nil {
		httpError(response, request, err)
		return
	}
	if containsPlayer {
		// This should be programmatic
		http.Error(response, "A player with that name is in the game", http.StatusBadRequest)
		return
	}

	//err := addPlayerToGame(gameJoinRequest.GameId, gameJoinRequest.Playername, conn)
	//if err != nil {
	//	httpError(response, request, err)
	//	return
	//}

	// playerToken := generatePlayerToken(gameJoinRequest.GameId, gameJoinRequest.PlayerName)
	io.WriteString(response, "ok") // I dunno there's a better way to do this but it's still a one liner
}
