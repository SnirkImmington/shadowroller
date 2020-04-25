package srserver

import (
	"fmt"
	"github.com/gomodule/redigo/redis"
	"log"
	"math/rand"
	"net/http"
	"srserver/config"
	"time"
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
		httpNotFound(response)
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

	event := PlayerJoinEvent{
		EventCore:  EventCore{Type: "playerJoin"},
		PlayerID:   playerID,
		PlayerName: join.PlayerName,
	}
	_, err = postEvent(join.GameID, event, conn)
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
	Count int    `json:"count"`
	Title string `json:"title"`
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

	event := RollEvent{
		EventCore:  EventCore{Type: "roll"},
		PlayerID:   auth.PlayerID,
		PlayerName: auth.PlayerName,
		Roll:       rolls,
		Title:      roll.Title,
	}
	_, err = postEvent(auth.GameID, event, conn)
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
	goID := rand.Intn(100)

	// Upgrade to SSE stream
	stream, err := sseUpgrader.Upgrade(response, request)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}

	err = stream.WriteEvent("ping", []byte("hi"))
	if err != nil {
		log.Print(goID, " Could not say hello: ", err)
		return
	}

	// Subscribe to redis
	conn := redisPool.Get()
	defer conn.Close()

	log.Printf("%v: Retrieving events in %s for %s...", goID, auth.GameID, auth.PlayerID)

	events, cancelled := receiveEvents(auth.GameID)
	defer func() { cancelled <- true }()

	selectInterval := time.Duration(config.SSEPingSecs) * time.Second
	for {
		if !stream.IsOpen() {
			log.Print(goID, " ", auth.PlayerID, " disconnected.")
			return
		}

		select {
		case event, open := <-events:
			if open {
				log.Print(goID, " ", event, " for ", auth.PlayerID)
				err := stream.WriteString(event)
				if err != nil {
					log.Print(goID, " Unable to write to stream: ", err)
					stream.Close()
					return
				}
			} else {
				log.Print(goID, " Event stream closed!")
				stream.Close()
				return
			}
		case <-time.After(selectInterval):
			err := stream.WriteEvent("ping", []byte("hi"))
			if err != nil {
				log.Print(goID, " Unable to ping stream: ", err)
				stream.Close()
				return
			}
		}
	}
}

type EventRangeRequest struct {
	Start string `json:"start"`
	End   string `json:"end"`
	Max   int    `json:"max"`
}

type EventRangeResponse struct {
	Events []Event // full event payload!
	LastID string
}

/*
   on join: { start: '', end: <lastEventID> }, backfill buffer
  -> [ {id: <some-early-id>, ... } ]
  if there's < max responses, client knows it's hit the boundary.
*/
// GET /event-range { start: <id>, end: <id>, max: int }
func handleEventRange(response Response, request *Request) {
	auth, err := authForRequest(request)
	if err != nil {
		httpUnauthorized(response, err)
		return
	}

	conn := redisPool.Get()
	defer conn.Close()

	var eventsRange EventRangeRequest
	err = readBodyJSON(request, &eventsRange)
	if err != nil {
		httpInvalidRequest(response, "Invalid request")
		return
	}
	if eventsRange.Max <= 0 {
		httpInvalidRequest(response, "Invalid range bound")
		return
	}

	if eventsRange.Max > config.MaxEventRange {
		message := fmt.Sprintf("Range bound too big! Max bound: %v", config.MaxEventRange)
		httpInvalidRequest(response, message)
		return
	}

	// We want to be careful here because these IDs are user input!
	//

	if eventsRange.Start == "" {
		eventsRange.Start = "-"
	} else if !validEventID(eventsRange.Start) {
		httpInvalidRequest(response, "Invalid start ID")
		return
	}

	if eventsRange.End == "" {
		eventsRange.End = "+"
	} else if !validEventID(eventsRange.End) {
		httpInvalidRequest(response, "Invalid end ID")
		return
	}

	resp, err := conn.Do(
		"XRANGE", "event:"+auth.GameID,
		eventsRange.End, eventsRange.Start,
		"COUNT", eventsRange.Max,
	)
}
