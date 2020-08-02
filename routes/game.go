package routes

import (
	"fmt"
	"github.com/gomodule/redigo/redis"
	"regexp"
	"sr"
	"sr/config"
	"time"
)

var gameRouter = restRouter.PathPrefix("/game").Subrouter()

var _ = gameRouter.HandleFunc("/info", handleInfo).Methods("GET")

// GET /info {gameInfo}
func handleInfo(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	httpUnauthorizedIf(response, request, err)
	defer sr.CloseRedis(conn)

	info, err := sr.GetGameInfo(sess.GameID, conn)
	httpInternalErrorIf(response, request, err)

	err = writeBodyJSON(response, &info)
	httpInternalErrorIf(response, request, err)
	httpSuccess(
		response, request,
		info.ID, ": ", len(info.Players), " players",
	)
}

type rollRequest struct {
	Count int    `json:"count"`
	Title string `json:"title"`
	Edge  bool   `json:"edge"`
}

var _ = gameRouter.HandleFunc("/roll", handleRoll).Methods("POST")

// $ POST /roll count
func handleRoll(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	httpUnauthorizedIf(response, request, err)
	defer sr.CloseRedis(conn)

	var roll rollRequest
	err = readBodyJSON(request, &roll)
	httpInternalErrorIf(response, request, err)

	if roll.Count > config.MaxSingleRoll {
		httpBadRequest(response, request, "Roll count too high")
	}

	var event sr.Event
	// Note that roll generation is possibly blocking
	if roll.Edge {
		rolls := sr.ExplodingSixes(roll.Count)
		logf(request, "%v: edge roll: %v",
			sess.LogInfo(), rolls,
		)
		event = sr.EdgeRollEvent{
			EventCore:  sr.EventCore{Type: "edgeRoll"},
			PlayerID:   string(sess.PlayerID),
			PlayerName: sess.PlayerName,
			Title:      roll.Title,
			Rounds:     rolls,
		}

	} else {
		rolls := make([]int, roll.Count)
		hits := sr.FillRolls(rolls)
		logf(request, "%v: roll: %v (%v hits)",
			sess.LogInfo(), rolls, hits,
		)
		event = sr.RollEvent{
			EventCore:  sr.EventCore{Type: "roll"},
			PlayerID:   string(sess.PlayerID),
			PlayerName: sess.PlayerName,
			Roll:       rolls,
			Title:      roll.Title,
		}
	}

	id, err := sr.PostEvent(sess.GameID, event, conn)
	httpInternalErrorIf(response, request, err)
	httpSuccess(
		response, request,
		"OK; roll ", id, " posted",
	)
}

type rerollRequest struct {
	RollID string `json:"rollID"`
	Type   string `json:"rerollType"`
}

var _ = gameRouter.HandleFunc("/reroll", handleReroll).Methods("POST")

func handleReroll(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	httpUnauthorizedIf(response, request, err)
	defer sr.CloseRedis(conn)

	var reroll rerollRequest
	err = readBodyJSON(request, &reroll)
	httpInternalErrorIf(response, request, err)

	if !sr.ValidRerollType(reroll.Type) {
        logf(request, "Got invalid roll type %v", reroll)
		httpBadRequest(response, request, "Invalid reroll type")
	}

	previousRoll, err := sr.EventByID(sess.GameID, reroll.RollID, conn)
    httpInternalErrorIf(response, request, err)

    if previousRoll["ty"] != "roll" {
        logf(request, "Expecting ty=roll, got %v", previousRoll)
        httpBadRequest(response, request, "Invalid previous roll")
    }

    previousDice, err := collectRolls(previousRoll["roll"])
    httpInternalErrorIf(response, request, err)

    if reroll.Type == sr.RerollTypeRerollFailures {
        newDice := sr.RerollFailures(previousDice)
        rounds := [][]int{ newDice, previousDice }
        rerollEvent := sr.RerollFailuresEvent{
            EventCore: sr.EventCore{"rerollFailures"},
            PrevID: reroll.RollID,
            PlayerID: string(sess.PlayerID),
            PlayerName: sess.PlayerName,
            Title: previousRoll["title"].(string),
            Rounds: rounds,
        }
        id, err := sr.PostEvent(sess.GameID, rerollEvent, conn)
        httpInternalErrorIf(response, request, err)
        httpSuccess(
            response, request,
            "OK; reroll ", id, " posted",
        )
    }
}

func collectRolls(in interface{}) ([]int, error) {
    rolls, ok := in.([]interface{})
    if !ok {
        return nil, fmt.Errorf("Unable to parse %v as []interface{}", in)
    }
    out := make([]int, len(rolls))
    for i, val := range(rolls) {
        floatVal, ok := val.(float64)
        if !ok {
            return nil, fmt.Errorf("unable to parse value %v (%T) as float", i, i)
        }
        out[i] = int(floatVal)
    }
    return out, nil
}

// Hacky workaround for logs to show event type.
// A user couldn't actually write "ty":"foo" in the field, though,
// as it'd come back escaped.
var eventParseRegex = regexp.MustCompile(`"ty":"([^"]+)"`)

var _ = gameRouter.HandleFunc("/subscription", handleSubscription).Methods("GET")

// GET /subscription -> SSE :ping, event
func handleSubscription(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestParamSession(request)
	httpUnauthorizedIf(response, request, err)
	defer sr.CloseRedis(conn)

	// Upgrade to SSE stream
	stream, err := sseUpgrader.Upgrade(response, request)
	httpInternalErrorIf(response, request, err)

	err = stream.WriteEvent("ping", []byte("hi"))
	if err != nil {
		logf(request, "Could not say hello: %v", err)
		return
	}

	// Subscribe to redis
	logf(request, "Retrieving events for %s...", sess.LogInfo())
	sr.UnexpireSession(&sess, conn)
	defer sr.ExpireSession(&sess, conn)

	events, cancelled := sr.ReceiveEvents(sess.GameID, requestID(request))
	defer func() { cancelled <- true }()

	selectInterval := time.Duration(config.SSEPingSecs) * time.Second
	for {
		if !stream.IsOpen() {
			logf(request, "Session %s disconnected", sess.LogInfo())
			ok, err := sr.UnexpireSession(&sess, conn)
			if err != nil {
				logf(request,
					"Error unexpiring session %s: %v",
					sess, err,
				)
			} else if !ok {
				logf(request, "Redis did not expire session %s", sess)
			}
			return
		}

		select {
		case event, open := <-events:
			if open {
				eventTy := eventParseRegex.FindString(event)
				logf(request, "Sending %v to %v",
					eventTy[5:], sess.LogInfo(),
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
				// Should get to the if !stream.Open handler
			}
		}
	}
}

type eventRangeResponse struct {
	Events []sr.EventOut `json:"events"`
	LastID string     `json:"lastId"`
	More   bool       `json:"more"`
}

var _ = gameRouter.HandleFunc("/events", handleEvents).Methods("GET")

/*
   on join: { start: '', end: <lastEventID> }, backfill buffer
  -> [ {id: <some-early-id>, ... } ]
  if there's < max responses, client knows it's hit the boundary.
*/
// GET /event-range { start: <id>, end: <id>, max: int }
func handleEvents(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	httpUnauthorizedIf(response, request, err)
	defer sr.CloseRedis(conn)

	newest := request.FormValue("newest")
	oldest := request.FormValue("oldest")

	// We want to be careful here because these IDs are user input!
	//

	if newest == "" {
		newest = "-"
	} else if !sr.ValidEventID(newest) {
		httpBadRequest(response, request, "Invalid newest ID")
	}

	if oldest == "" {
		oldest = "+"
	} else if !sr.ValidEventID(oldest) {
		httpBadRequest(response, request, "Invalid oldest ID")
	}

	logf(request, "Retrieve events {%s : %s} for %s",
		oldest, newest, sess.LogInfo(),
	)

	// TODO move to events.go
	eventsData, err := redis.Values(conn.Do(
		"XREVRANGE", "event:"+sess.GameID, oldest, newest,
		"COUNT", config.MaxEventRange,
	))
	if err != nil {
		logf(request, "Unable to list events from redis")
		httpInternalErrorIf(response, request, err)
	}

	var eventRange eventRangeResponse
	var message string

	if len(eventsData) == 0 {
		eventRange = eventRangeResponse{
			Events: make([]sr.EventOut, 0),
			LastID: "",
			More:   false,
		}
		message = "0 events"
	} else {
		events, err := sr.ScanEvents(eventsData)
		if err != nil {
			logf(request, "Unable to parse events: %v", err)
			httpInternalErrorIf(response, request, err)
			return
		}

		firstID := events[0]["id"].(string)
		lastID := events[len(events)-1]["id"].(string)

		eventRange = eventRangeResponse{
			Events: events,
			More:   len(events) == config.MaxEventRange,
		}
		message = fmt.Sprintf(
			"%s : %s ; %v events",
			firstID, lastID, len(events),
		)
	}

	err = writeBodyJSON(response, eventRange)
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request, message)
}
