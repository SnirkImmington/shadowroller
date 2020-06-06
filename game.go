package srserver

import (
	//"encoding/json"
	"errors"
	"github.com/gomodule/redigo/redis"
	"log"
	"math/rand"
	"net/http"
	"srserver/config"
	"time"
)

type gameJoinRequest struct {
	GameID     string `json:"gameID"`
	PlayerName string `json:"playerName"`
}

type joinGameResponse struct {
	PlayerID      string            `json:"playerID"`
	Players       map[string]string `json:"players"`
	NewestEventID string            `json:"newestID"`
}

var errGameNotFound error = errors.New("game not found")

// * POST /join-game { gameId, playerId } => { token, playerID }
func handleJoinGame(response Response, request *Request) {
	logRequest(request)
	var join gameJoinRequest
	err := readBodyJSON(request, &join)
	if err != nil {
		httpInvalidRequest(response, "Invalid request")
		return
	}

	conn := redisPool.Get()
	defer closeRedis(conn)

	// Unauthorized
	gameExists, err := redis.Bool(conn.Do("exists", "game:"+join.GameID))
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	if !gameExists {
		httpUnauthorized(response, errGameNotFound)
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
	newestEventID, err := postEvent(join.GameID, event, conn)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}

	log.Printf("%v (%v) has joined %v",
		playerID, join.PlayerName, join.GameID,
	)

	// Create JWT
	cookie, err := createAuthCookie(join.GameID, playerID, join.PlayerName)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	http.SetCookie(response, cookie)

	joined := joinGameResponse{
		PlayerID:      playerID,
		Players:       players,
		NewestEventID: newestEventID,
	}
	err = writeBodyJSON(response, joined)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	httpSuccess(response, "join ", join.GameID)
}

// $ GET /players => { <id>: <name> }
func handleGetPlayers(response Response, request *Request) {
	logRequest(request)
	auth, err := authForRequest(request)
	if err != nil {
		httpUnauthorized(response, err)
		return
	}

	conn := redisPool.Get()
	defer closeRedis(conn)

	players, err := redis.StringMap(conn.Do("hgetall", "player:"+auth.GameID))
	if err != nil {
		httpInternalError(response, request, err)
		return
	}

	err = writeBodyJSON(response, players)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	httpSuccess(response, len(players), " players")
}

type rollRequest struct {
	Count int    `json:"count"`
	Title string `json:"title"`
}

// $ POST /roll count
func handleRoll(response Response, request *Request) {
	logRequest(request)
	auth, err := authForRequest(request)
	if err != nil {
		httpUnauthorized(response, err)
		return
	}

	var roll rollRequest
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
	defer closeRedis(conn)

	// Block here for the roll.
	rolls := make([]int, roll.Count)
	fillRolls(rolls)

	log.Printf("%v (%v) rolled %v in %v",
		auth.PlayerID, auth.PlayerName, rolls, auth.GameID,
	)

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
	httpSuccess(response, "rolled ", len(rolls), " dice")
}

// $ GET /events
func handleEvents(response Response, request *Request) {
	logRequest(request)
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
	defer closeRedis(conn)

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
				err := stream.WriteString(event)
				if err != nil {
					log.Print(goID, " Unable to write to stream: ", err)
					stream.Close()
					return
				}
			} else {
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

type eventRangeRequest struct {
	Newest string `json:"newest"`
	Oldest string `json:"oldest"`
}

type eventRangeResponse struct {
	Events []map[string]interface{} `json:"events"`
	LastID string                   `json:"lastId"`
	More   bool                     `json:"more"`
}

/*
   on join: { start: '', end: <lastEventID> }, backfill buffer
  -> [ {id: <some-early-id>, ... } ]
  if there's < max responses, client knows it's hit the boundary.
*/
// GET /event-range { start: <id>, end: <id>, max: int }
func handleEventRange(response Response, request *Request) {
	logRequest(request)
	auth, err := authForRequest(request)
	if err != nil {
		httpUnauthorized(response, err)
		return
	}

	conn := redisPool.Get()
	defer closeRedis(conn)

	var eventsRange eventRangeRequest
	err = readBodyJSON(request, &eventsRange)
	if err != nil {
		httpInvalidRequest(response, "Invalid request")
		return
	}

	log.Printf("Retrieve events %v for %v (%v)", eventsRange, auth.PlayerID, auth.PlayerName)

	// We want to be careful here because these IDs are user input!
	//

	if eventsRange.Newest == "" {
		eventsRange.Newest = "-"
	} else if !validEventID(eventsRange.Newest) {
		httpInvalidRequest(response, "Invalid newest ID")
		return
	}

	if eventsRange.Oldest == "" {
		eventsRange.Oldest = "+"
	} else if !validEventID(eventsRange.Oldest) {
		httpInvalidRequest(response, "Invalid oldest ID")
		return
	}

	log.Println("Parsed event range", eventsRange)

	eventsData, err := redis.Values(conn.Do(
		"XREVRANGE", "event:"+auth.GameID,
		eventsRange.Oldest, eventsRange.Newest,
		"COUNT", config.MaxEventRange,
	))
	if err != nil {
		log.Print("Unable to list events from redis")
		httpInternalError(response, request, err)
		return
	}

	if len(eventsData) == 0 {
		eventRange := eventRangeResponse{
			Events: make([]map[string]interface{}, 0),
			LastID: "",
			More:   false,
		}
		err = writeBodyJSON(response, eventRange)
		if err != nil {
			httpInternalError(response, request, err)
			return
		}
		httpSuccess(response, "0 events")
		return
	}

	events, err := scanEvents(eventsData)
	if err != nil {
		log.Print("Unable to parse events:", err)
		httpInternalError(response, request, err)
		return
	}

	firstID := events[0]["id"].(string)
	lastID := events[len(events)-1]["id"].(string)

	eventRange := eventRangeResponse{
		Events: events,
		More:   len(events) == config.MaxEventRange,
	}
	err = writeBodyJSON(response, eventRange)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	httpSuccess(response, firstID, " ... ", lastID, "; ", len(events), " events")
}
