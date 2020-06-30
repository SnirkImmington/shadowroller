package srserver

import (
	//"encoding/json"
	"errors"
	"github.com/gomodule/redigo/redis"
	"net/http"
	"regexp"
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
		httpInvalidRequest(response, request, "Invalid request")
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
		httpUnauthorized(response, request, errGameNotFound)
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

	logf(request, "%v (%v) has joined %v",
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
	httpSuccess(response, request, "join ", join.GameID)
}

// $ GET /players => { <id>: <name> }
func handleGetPlayers(response Response, request *Request) {
	logRequest(request)
	auth, err := authForRequest(request)
	if err != nil {
		httpUnauthorized(response, request, err)
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
	httpSuccess(response, request, len(players), " players")
}

type rollRequest struct {
	Count int    `json:"count"`
	Title string `json:"title"`
	Edge  bool   `json:"edge"`
}

// $ POST /roll count
func handleRoll(response Response, request *Request) {
	logRequest(request)
	auth, err := authForRequest(request)
	if err != nil {
		httpUnauthorized(response, request, err)
		return
	}

	var roll rollRequest
	err = readBodyJSON(request, &roll)
	if err != nil {
		httpInvalidRequest(response, request, "Invalid request")
		return
	}

	if roll.Count > config.MaxSingleRoll {
		httpInvalidRequest(response, request, "Invalid Roll count")
		return
	}

	conn := redisPool.Get()
	defer closeRedis(conn)

	var event Event
	// Note that roll generation is possibly blocking
	if roll.Edge {
		rolls := explodingSixes(roll.Count)
		logf(request, "%v: edge roll: %v",
			auth, rolls,
		)
		event = EdgeRollEvent{
			EventCore:  EventCore{Type: "edgeRoll"},
			PlayerID:   auth.PlayerID,
			PlayerName: auth.PlayerName,
			Title:      roll.Title,
			Rounds:     rolls,
		}

	} else {
		rolls := make([]int, roll.Count)
		fillRolls(rolls)
		logf(request, "%v: roll: %v",
			auth, rolls,
		)
		event = RollEvent{
			EventCore:  EventCore{Type: "roll"},
			PlayerID:   auth.PlayerID,
			PlayerName: auth.PlayerName,
			Roll:       rolls,
			Title:      roll.Title,
		}
	}

	id, err := postEvent(auth.GameID, event, conn)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}
	httpSuccess(response, request, "roll ", id, " posted")
}

// Hacky workaround for logs to show event type.
// A user couldn't actually write "ty":"foo" in the field, though,
// as it'd come back escaped.
var eventParseRegex = regexp.MustCompile(`"ty":"([^"]+)"`)

// $ GET /events
func handleEvents(response Response, request *Request) {
	logRequest(request)
	auth, err := authForRequest(request)
	if err != nil {
		httpUnauthorized(response, request, err)
		return
	}

	// Upgrade to SSE stream
	stream, err := sseUpgrader.Upgrade(response, request)
	if err != nil {
		httpInternalError(response, request, err)
		return
	}

	err = stream.WriteEvent("ping", []byte("hi"))
	if err != nil {
		logf(request, " Could not say hello: %v", err)
		return
	}

	// Subscribe to redis
	conn := redisPool.Get()
	defer closeRedis(conn)

	logf(request, "Retrieving events in %v for %v...",
		auth.GameID, auth.PlayerID,
	)

	events, cancelled := receiveEvents(auth.GameID)
	defer func() { cancelled <- true }()

	selectInterval := time.Duration(config.SSEPingSecs) * time.Second
	for {
		if !stream.IsOpen() {
			logf(request, "%v (%v) disconnected from %v",
				auth.PlayerID, auth.PlayerName, auth.GameID,
			)
			return
		}

		select {
		case event, open := <-events:
			if open {
				eventTy := eventParseRegex.FindString(event)
				logf(request, "Sending %v to %v",
					eventTy[5:], auth,
				)
				err := stream.WriteString(event)
				if err != nil {
					logf(request, "Unable to write to stream: %v", err)
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
				logf(request, "Unable to ping stream: %v", err)
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
		httpUnauthorized(response, request, err)
		return
	}

	conn := redisPool.Get()
	defer closeRedis(conn)

	var eventsRange eventRangeRequest
	err = readBodyJSON(request, &eventsRange)
	if err != nil {
		httpInvalidRequest(response, request, "Invalid request")
		return
	}

	// We want to be careful here because these IDs are user input!
	//

	if eventsRange.Newest == "" {
		eventsRange.Newest = "-"
	} else if !validEventID(eventsRange.Newest) {
		httpInvalidRequest(response, request, "Invalid newest ID")
		return
	}

	if eventsRange.Oldest == "" {
		eventsRange.Oldest = "+"
	} else if !validEventID(eventsRange.Oldest) {
		httpInvalidRequest(response, request, "Invalid oldest ID")
		return
	}

	logf(request, "Retrieve events %v for %v (%v) in %v",
		eventsRange, auth.PlayerID, auth.PlayerName, auth.GameID,
	)

	eventsData, err := redis.Values(conn.Do(
		"XREVRANGE", "event:"+auth.GameID,
		eventsRange.Oldest, eventsRange.Newest,
		"COUNT", config.MaxEventRange,
	))
	if err != nil {
		logf(request, "Unable to list events from redis")
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
		httpSuccess(response, request, "0 events")
		return
	}

	events, err := scanEvents(eventsData)
	if err != nil {
		logf(request, "Unable to parse events: %v", err)
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
	httpSuccess(response, request, firstID, " ... ", lastID, "; ", len(events), " events")
}
