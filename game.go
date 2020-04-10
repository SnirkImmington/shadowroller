package srserver

import (
	"github.com/gomodule/redigo/redis"
	"log"
	"net/http"
	"srserver/config"
)

type GameJoinRequest struct {
	GameID     string `json:"gameID"`
	PlayerName string `json:"playerName"`
}

type JoinGameResponse struct {
	PlayerID string            `json:"playerID"`
	Players  map[string]string `json:"players"`
	Token    string            `json:"token"`
}

// * POST /join-game { gameId, playerId } => { token, playerID }
func handleJoinGame(response Response, request *Request) {
	var join GameJoinRequest
	err := readBodyJSON(request, &join)
	if err != nil {
		httpInvalidRequest(response, "Invalid request")
		return
	}

	conn := redisPool.Get()
	defer conn.Close()

	// Unauthorized
	gameExists, err := redis.Bool(conn.Do("exists", "game:"+join.GameID))
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	if !gameExists {
		http.Error(response, "Game not found", 404)
		return
	}

	playerID := GenUID()

	// Get all the players then set
	err = conn.Send("hmset", "player:"+join.GameID, playerID, join.PlayerName)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	err = conn.Send("hgetall", "player:"+join.GameID)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	err = conn.Flush()
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	_, err = conn.Receive()
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	players, err := redis.StringMap(conn.Receive())
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	players[playerID] = join.PlayerName

	_, err = postEvent(join.GameID, makePlayerJoinEvent(playerID, join.PlayerName), conn)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}

	// Create JWT

	token, err := createAuthToken(join.GameID, playerID)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}

	joined := JoinGameResponse{
		PlayerID: playerID,
		Players:  players,
		Token:    token,
	}
	err = writeBodyJSON(response, joined)
	if err != nil {
		httpInternalError(response, request, err)
	}
}

type RollRequest struct {
	Count int `json:"count"`
}

// $ POST /roll count
func handleRoll(response Response, request *Request) {
	auth, err := authForRequest(request)
	if err != nil {
		httpUnauthorized(response)
	}

	var roll RollRequest
	err = readBodyJSON(request, &roll)
	if err != nil {
		httpInvalidRequest(response, "Invalid request")
		return
	}

	if roll.Count > config.MaxSingleRoll {
		httpInvalidRequest(response, "Invalid Roll count")
		return
	}

	conn := redisPool.Get()
	defer conn.Close()

	// Block here for the roll.
	rolls := make([]byte, roll.Count)
	fillRolls(rolls)

	_, err = postEvent(auth.GameID, makeRollEvent(auth.PlayerID, rolls), conn)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	httpSuccess(response)
}

// $ GET /events
func handleEvents(response Response, request *Request) {
	auth, err := authForRequest(request)
	if err != nil {
		httpUnauthorized(response)
		return
	}
	// Upgrade to SSE stream
	stream, err := sseUpgrader.Upgrade(response, request)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	// Subscribe to redis
	conn := redisPool.Get()
	defer conn.Close()
	conn.Send("subscribe", "game_event:"+auth.GameID)
	conn.Flush()
	for {
		log.Printf("Retrieving events in %s for %s...",
			auth.GameID, auth.PlayerID)

		event, err := redis.String(conn.Receive())
		//eventType := event["type"]
		//delete(event, "type")
		if err != nil {
			log.Printf("Internal error handling %s /event: %w", auth.GameID, err)
			stream.Close()
			return
		}
		log.Printf("--> ", auth.GameID /*event["id"], eventType,*/, "to", auth.PlayerID)
		stream.WriteJson(event) // TODO will this work???
	}
}
