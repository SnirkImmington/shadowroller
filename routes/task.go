package routes

import (
	"encoding/json"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"net/http"
	"sr"
	"sr/config"
	"strconv"
	"strings"
)

// RegisterTasksViaConfig adds the /task route if it's enabled.
// It must be called after config values are loaded.
func RegisterTasksViaConfig() {
	if config.EnableTasks {
		tasksRouter.NotFoundHandler = http.HandlerFunc(notFoundHandler)
		restRouter.PathPrefix("/task").Handler(tasksRouter)
	}
	if config.TasksLocalhostOnly {
		tasksRouter.Use(localhostOnlyMiddleware)
	}
}

var tasksRouter = apiRouter().PathPrefix("/task").Subrouter()

var _ = tasksRouter.HandleFunc("/create-game", handleCreateGame).Methods("GET")

func handleCreateGame(response Response, request *Request) {
	logRequest(request)
	gameID := request.FormValue("gameID")
	if gameID == "" {
		httpBadRequest(response, request, "Invalid game ID")
	}

	conn := sr.RedisPool.Get()
	defer sr.CloseRedis(conn)

	if exists, err := sr.GameExists(gameID, conn); exists {
		httpInternalErrorIf(response, request, err)
		httpBadRequest(response, request, "Game already exists")
	}

	set, err := redis.Int(conn.Do(
		"HSET", "game:"+gameID,
		"created_at", sr.TimestampNow(),
	))
	httpInternalErrorIf(response, request, err)
	if set != 1 {
		httpInternalError(response, request,
			fmt.Sprintf("Expected 1 new field to be updated, got %v", set),
		)
	}
	httpSuccess(response, request,
		"Game ", gameID, " created",
	)
}

var _ = tasksRouter.HandleFunc("/delete-game", handleCreateGame).Methods("GET")

func handleDeleteGame(response Response, request *Request) {
	logRequest(request)
	gameID := request.FormValue("gameID")
	if gameID == "" {
		httpBadRequest(response, request, "Invalid game ID")
	}

	conn := sr.RedisPool.Get()
	defer sr.CloseRedis(conn)

	if exists, err := sr.GameExists(gameID, conn); !exists {
		httpInternalErrorIf(response, request, err)
		httpBadRequest(response, request, "Game does not exist")
	}

	set, err := redis.Int(conn.Do(
		"del", "game:"+gameID,
	))
	httpInternalErrorIf(response, request, err)
	if set != 1 {
		httpInternalError(response, request,
			fmt.Sprintf("Expected 1 game to be deleted, got %v", set),
		)
	}
	httpSuccess(response, request,
		"Game ", gameID, " deleted",
	)
}

var _ = tasksRouter.HandleFunc("/migrate-events", handleMigrateEvents).Methods("GET")

// EventOut is the type of unmanaged JSON
type EventOut map[string]interface{}

func handleMigrateEvents(response Response, request *Request) {
	logRequest(request)
	newestID := "+"
	oldestID := "-"
	batchSize := 50

	conn := sr.RedisPool.Get()
	defer sr.CloseRedis(conn)

	gameID := request.FormValue("gameID")
	if gameID == "" {
		httpBadRequest(response, request, "Invalid game ID")
	}

	eventCount := 0
	batch := 1
	for {
		logf(request, "Retrieving batch %v [%v ... %v] (%v)", batch, newestID, oldestID, batchSize)
		eventsData, err := redis.Values(conn.Do(
			"XREVRANGE", "event:"+gameID,
			newestID, oldestID, "COUNT", batchSize,
		))
		if err != nil {
			logf(request, "Error retrieving events: %v", err)
			httpInternalErrorIf(response, request, err)
		}

		if len(eventsData) == 0 {
			logf(request, "Got empty data back")
			break
		}
		events, err := scanEvents(eventsData)
		if err != nil {
			logf(request, "Unable to parse events: %v", err)
			httpInternalErrorIf(response, request, err)
		}
		if events[0]["id"].(string) == newestID {
			events = events[1:]
		}
		if len(events) == 0 {
			batch--
			break
		}

		for ix, event := range events {
			if ix == len(events)-1 {
				// set id
				logf(request, "Resetting newest ID to %v", event["id"])
				newestID = event["id"].(string)
			}
			eventID := event["id"].(string)
			eventTy := event["ty"].(string)
			playerID := sr.URLSafeBase64(event["pID"].(string))
			logf(request, "Processing %v event %v", eventTy, eventID)

			newID, err := strconv.Atoi(strings.SplitN(eventID, "-", 2)[0])
			httpInternalErrorIf(response, request, err)
			core := sr.EventCore{
				ID:         int64(newID),
				Type:       eventTy,
				PlayerID:   sr.UID(playerID),
				PlayerName: event["pName"].(string),
			}

			var out sr.Event
			switch eventTy {
			case sr.EventTypeRoll:
				title := ""
				if strTitle, ok := event["title"].(string); ok {
					title = strTitle
				}
				out = &sr.RollEvent{
					EventCore: core,
					Title:     title,
					Dice:      sr.ConvertRolls(event["roll"].([]interface{})),
				}
			case sr.EventTypeEdgeRoll:
				out = &sr.EdgeRollEvent{
					EventCore: core,
					Title:     event["title"].(string),
					Rounds:    sr.ConvertRounds(event["rounds"].([]interface{})),
				}
			case sr.EventTypeRerollFailures:
				prevID, err := strconv.Atoi(strings.SplitN(event["prevID"].(string), "-", 2)[0])
				httpInternalErrorIf(response, request, err)
				out = &sr.RerollFailuresEvent{
					EventCore: core,
					PrevID:    int64(prevID),
					Title:     event["title"].(string),
					Rounds:    sr.ConvertRounds(event["rounds"].([]interface{})),
				}
			case sr.EventTypePlayerJoin:
				out = &sr.PlayerJoinEvent{
					EventCore: core,
				}
			default:
				httpInternalError(response, request, fmt.Sprintf("Found event %v with invalid type %v", newID, eventTy))
			}
			eventCount++

			jsonEvent, err := json.Marshal(out)
			httpInternalErrorIf(response, request, err)
			logf(request, "Got new event %v", string(jsonEvent))
			err = sr.PostEvent(gameID, out, conn)
			httpInternalErrorIf(response, request, err)
		}
		logf(request, "Batch %v complete", batch)
		batch++
	}
	httpSuccess(response, request,
		"Processed ", eventCount, " events in ", gameID, " (", batch, " batches)",
	)
}

// scanEvents scans event strings from redis
func scanEvents(eventsData []interface{}) ([]EventOut, error) {
	events := make([]EventOut, len(eventsData))

	for i := 0; i < len(eventsData); i++ {
		eventInfo := eventsData[i].([]interface{})

		eventID := string(eventInfo[0].([]byte))
		fieldList := eventInfo[1].([]interface{})

		eventValue := fieldList[1].([]byte)

		var event map[string]interface{}
		err := json.Unmarshal(eventValue, &event)
		if err != nil {
			return nil, err
		}
		event["id"] = eventID
		events[i] = EventOut(event)
	}
	return events, nil
}

var _ = tasksRouter.HandleFunc("/trim-players", handleTrimPlayers).Methods("GET")

func handleTrimPlayers(response Response, request *Request) {
	logRequest(request)
	_, conn, err := requestSession(request)
	httpUnauthorizedIf(response, request, err)
	defer sr.CloseRedis(conn)

	gameID := request.URL.Query().Get("gameID")
	if gameID == "" {
		httpBadRequest(response, request, "No game ID given")
	}
	logf(request, "Trimming players in %v", gameID)
	exists, err := sr.GameExists(gameID, conn)
	httpInternalErrorIf(response, request, err)
	if !exists {
		httpBadRequest(response, request, "No game '"+gameID+"' found")
	}

	sessionKeys, err := redis.Strings(conn.Do("keys", "session:*"))
	httpInternalErrorIf(response, request, err)
	logf(request, "Found %v sessions", len(sessionKeys))
	if len(sessionKeys) == 0 {
		httpInternalError(response, request, "There are no sessions")
	}
	err = conn.Send("MULTI")
	httpInternalErrorIf(response, request, err)

	// var foundPlayers map[string]bool

	for _, key := range sessionKeys {
		sessionID := key[8:]
		logf(request, "Checking for session %v in %v", sessionID, gameID)
		sess, err := sr.GetSessionByID(sessionID, conn)
		logf(request, "Found %v", sess.LogInfo())
		httpInternalErrorIf(response, request, err)
	}
}
