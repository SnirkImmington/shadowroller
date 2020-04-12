package srserver

import (
	"github.com/gomodule/redigo/redis"
	"log"
	"net/http"
	"srserver/config"
	"strings"
)

type GameJoinRequest struct {
	GameID     string `json:"gameID"`
	PlayerName string `json:"playerName"`
}

type JoinGameResponse struct {
	PlayerID string            `json:"playerID"`
	Players  map[string]string `json:"players"`
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
	cookie, err := createAuthCookie(join.GameID, playerID, join.PlayerName)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	http.SetCookie(response, cookie)

	joined := JoinGameResponse{
		PlayerID: playerID,
		Players:  players,
	}
	err = writeBodyJSON(response, joined)
	if err != nil {
		httpInternalError(response, request, err)
	} else {
		log.Printf("-> auth %s to join %s as %s", join.PlayerName, join.GameID, playerID)
	}
}

// $ GET /players => { <id>: <name> }
func handleGetPlayers(response Response, request *Request) {
	auth, err := authForRequest(request)
	if err != nil {
		httpUnauthorized(response, err)
		return
	}

	conn := redisPool.Get()
	defer conn.Close()

	players, err := redis.StringMap(conn.Do("hgetall", "player:"+auth.GameID))
	if err != nil {
		httpInternalError(response, request, err)
		return
	}

	err = writeBodyJSON(response, players)
	if err != nil {
		httpInternalError(response, request, err)
	} else {
		log.Print("-> ", len(players), " players")
	}
}

type RollRequest struct {
	Count int `json:"count"`
}

// $ POST /roll count
func handleRoll(response Response, request *Request) {
	auth, err := authForRequest(request)
	if err != nil {
		httpUnauthorized(response, err)
		return
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
	rolls := make([]int, roll.Count)
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
		httpUnauthorized(response, err)
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
	sub := redis.PubSubConn{Conn: conn}
	err = sub.Subscribe("game_event:" + auth.GameID)
	if err != nil {
		log.Printf("Error subscribing to game events", err)
		stream.Close()
		return
	}

	log.Printf("Retrieving events in %s for %s...", auth.GameID, auth.PlayerID)
	for {
		if !stream.IsOpen() {
			log.Print("> ", auth.PlayerID, " disconnected.")
			return
		}
		log.Printf("Receiving...")
		switch m := sub.Receive().(type) { //sub.ReceiveWithTimeout(time.Duration(5) * time.Second).(type) {
		case redis.Message:
			log.Print("> event ", auth.GameID, " to ", auth.PlayerID)
			err := stream.Write(m.Data)
			if err != nil {
				log.Print("Error writing to stream: ", err)
				return
			}
		case redis.Subscription:
			log.Print("Subbed: ", m)
		case error:
			if !strings.Contains(m.Error(), "timeout") {
				log.Print("Error reading from redis: ", m)
				stream.Close()
				return
			} else {
				log.Print("Hit redis timeout, retrying")
				sub = redis.PubSubConn{Conn: conn}
			}
			// otherwise timeout is okay, we're polling stream.isOpen
		}
	}
}
