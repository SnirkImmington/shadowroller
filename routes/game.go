package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"sr"
	"sr/config"
	"strings"
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

type renameRequest struct {
	Name string `json:"name"`
}

var _ = gameRouter.HandleFunc("/rename", handleRename).Methods("POST")

func handleRename(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	httpUnauthorizedIf(response, request, err)
	defer sr.CloseRedis(conn)

	var rename renameRequest
	err = readBodyJSON(request, &rename)
	httpInternalErrorIf(response, request, err)

	update := sr.PlayerRenameUpdate(sess.PlayerID, rename.Name)
	err = sr.PostUpdate(sess.GameID, &update, conn)
	httpInternalErrorIf(response, request, err)

	httpSuccess(
		response, request,
		sess.PlayerID, " [",
		sess.PlayerName, "] -> [", rename.Name, "]",
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
		event = &sr.EdgeRollEvent{
			EventCore: sr.EventCore{
				ID:         sr.NewEventID(),
				Type:       sr.EventTypeEdgeRoll,
				PlayerID:   sess.PlayerID,
				PlayerName: sess.PlayerName,
			},
			Title:  roll.Title,
			Rounds: rolls,
		}

	} else {
		rolls := make([]int, roll.Count)
		hits := sr.FillRolls(rolls)
		logf(request, "%v: roll: %v (%v hits)",
			sess.LogInfo(), rolls, hits,
		)
		event = &sr.RollEvent{
			EventCore: sr.EventCore{
				ID:         sr.NewEventID(),
				Type:       sr.EventTypeRoll,
				PlayerID:   sess.PlayerID,
				PlayerName: sess.PlayerName,
			},
			Dice:  rolls,
			Title: roll.Title,
		}
	}

	err = sr.PostEvent(sess.GameID, event, conn)
	httpInternalErrorIf(response, request, err)
	httpSuccess(
		response, request,
		"OK; roll ", event.GetID(), " posted",
	)
}

type rerollRequest struct {
	RollID int64  `json:"rollID"`
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
	logf(request, "Rerolling roll %v from %v",
		reroll.RollID, sess.PlayerInfo(),
	)

	previousRollText, err := sr.EventByID(sess.GameID, reroll.RollID, conn)
	httpInternalErrorIf(response, request, err)
	var previousRoll sr.RollEvent
	err = json.Unmarshal([]byte(previousRollText), &previousRoll)
	if err != nil {
		logf(request, "Expecting to parse previous roll")
		httpBadRequest(response, request, "Invalid previous roll")
	}
	logf(request, "Got previous roll %#v", previousRoll)

	if reroll.Type == sr.RerollTypeRerollFailures {
		newDice := sr.RerollFailures(previousRoll.Dice)
		rounds := [][]int{newDice, previousRoll.Dice}
		rerollEvent := sr.RerollFailuresEvent{
			EventCore: sr.RerollFailuresEventCore(&sess),
			PrevID:    previousRoll.ID,
			Title:     previousRoll.Title,
			Rounds:    rounds,
		}
		err = sr.PostEvent(sess.GameID, &rerollEvent, conn)
		httpInternalErrorIf(response, request, err)
		httpSuccess(
			response, request,
			"OK; reroll ", rerollEvent.ID, " posted",
		)
	} else {
		httpBadRequest(response, request, "Invalid reroll type")
	}
}

func collectRolls(in interface{}) ([]int, error) {
	rolls, ok := in.([]interface{})
	if !ok {
		return nil, fmt.Errorf("Unable to assert %v as []interface{}", in)
	}
	out := make([]int, len(rolls))
	for i, val := range rolls {
		floatVal, ok := val.(float64)
		if !ok {
			return nil, fmt.Errorf("unable to parse value %v (%T) as float", i, i)
		}
		out[i] = int(floatVal)
	}
	return out, nil
}

var removeDecimal = regexp.MustCompile(`\.\d+`)

var _ = gameRouter.HandleFunc("/subscription", handleSubscription).Methods("GET")

// GET /subscription?session= Last-Event-ID: -> SSE :ping, event
func handleSubscription(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestParamSession(request)
	httpUnauthorizedIf(response, request, err)
	defer sr.CloseRedis(conn)

	// Upgrade to SSE stream
	logf(request, "Upgrading to SSE")
	stream, err := sseUpgrader.Upgrade(response, request)
	lastPing := time.Now()
	httpInternalErrorIf(response, request, err)

	// Subscribe to redis
	logf(request, "Opening pub/sub for %v", sess.LogInfo())
	subCtx, cancel := context.WithCancel(request.Context())
	messages, errChan := sr.SubscribeToGame(subCtx, sess.GameID)
	logf(request, "Game subscription successful")
	select {
	case firstErr := <-errChan:
		logf(request, "Error initially opening game subscription: %v", firstErr)
		httpInternalErrorIf(response, request, firstErr)
	default:
		// No error connecting
	}

	// Restart the session's month/15 min duration while streaming
	logf(request, "Unexpire session %v", sess.LogInfo())
	_, err = sr.UnexpireSession(&sess, conn)
	defer func() {
		if _, err := sr.ExpireSession(&sess, conn); err != nil {
			logf(request, "Error expiring session %v: %v", sess.LogInfo(), err)
		}
	}()

	// Begin writing events
	logf(request, "Begin receiving events...")
	for {
		const pollInterval = time.Duration(2) * time.Second
		ssePingInterval := time.Duration(config.SSEPingSecs) * time.Second
		now := time.Now()
		if !stream.IsOpen() {
			logf(request, "Connection closed by remote host")
			break
		}
		if now.Sub(lastPing) >= ssePingInterval {
			err = stream.WriteStringEvent("", "")
			if err != nil {
				logf(request, "Unable to write to stream: %v", err)
				break
			}
			lastPing = now
		}
		select {
		case messageText := <-messages:
			body := strings.SplitN(messageText, ":", 2)
			if len(body) != 2 {
				logf(request, "Unable to parse message '%v'", body)
				break
			}
			messageID := sr.ParseEventID(body[1])
			messageTy := sr.ParseEventTy(body[1])
			// channel := body[0] ; message := body[1]
			err = stream.WriteEventWithID(messageID, body[0], []byte(body[1]))
			if err != nil {
				logf(request, "Unable to write %s to stream: %v", messageText, err)
				break
			}
			logf(request, "Sent %v %s %s (%s).", sess.LogInfo(), body[0], messageID, messageTy)
		case err := <-errChan:
			logf(request, "Error from subscription goroutine: %v", err)
			break
		case <-time.After(pollInterval):
			// Need to recheck stream.IsOpen()
			continue
		}
	}
	cancel()
	dur := removeDecimal.ReplaceAllString(displayRequestDuration(subCtx), "")
	logf(request, ">> --- Subscription for %v closed (%v)", sess.LogInfo(), dur)
	if stream.IsOpen() {
		stream.Close()
	}
}

type eventRangeResponse struct {
	Events []sr.Event `json:"events"`
	LastID string     `json:"lastID"`
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

	if newest == "" {
		newest = "+inf"
	} else if !sr.ValidEventID(newest) {
		httpBadRequest(response, request, "Invalid newest ID")
	}

	if oldest == "" {
		oldest = "-inf"
	} else if !sr.ValidEventID(oldest) {
		httpBadRequest(response, request, "Invalid oldest ID")
	}

	logf(request, "Retrieve events [%s ... %s] for %s",
		oldest, newest, sess.LogInfo(),
	)

	events, err := sr.EventsBetween(
		sess.GameID, newest, oldest, config.MaxEventRange, conn,
	)
	if err != nil {
		logf(request, "Unable to list events from redis: %v", err)
		httpInternalErrorIf(response, request, err)
	}

	var eventRange eventRangeResponse
	var message string

	if len(events) == 0 {
		eventRange = eventRangeResponse{
			Events: []sr.Event{},
			LastID: "",
			More:   false,
		}
		message = "0 events"
	} else {
		parsed := make([]sr.Event, len(events))
		for i, event := range events {
			ev, err := sr.ParseEvent([]byte(event))
			if err != nil {
				err := fmt.Errorf("Error parsing event %v: %w", i, err)
				httpInternalErrorIf(response, request, err)
			}
			parsed[i] = ev
		}
		firstID := parsed[0].GetID()
		lastID := parsed[len(parsed)-1].GetID()

		eventRange = eventRangeResponse{
			Events: parsed,
			LastID: string(lastID),
			More:   len(events) == config.MaxEventRange,
		}
		message = fmt.Sprintf(
			"[%v ... %v] ; %v events",
			firstID, lastID, len(events),
		)
	}

	err = writeBodyJSON(response, eventRange)
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request, message)
}
