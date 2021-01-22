package routes

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
	"regexp"
	"sr"
	"sr/config"
	"sr/event"
	"sr/game"
	"sr/id"
	"sr/update"
	"strings"
	"time"
)

var gameRouter = restRouter.PathPrefix("/game").Subrouter()

var _ = gameRouter.HandleFunc("/info", handleInfo).Methods("GET")

// GET /info {gameInfo}
func handleInfo(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	defer closeRedis(request, conn)
	httpUnauthorizedIf(response, request, err)

	info, err := game.GetInfo(sess.GameID, conn)
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

var _ = gameRouter.HandleFunc("/modify-roll", handleUpdateEvent).Methods("POST")

type updateEventRequest struct {
	ID   int64                  `json:"id"`
	Diff map[string]interface{} `json:"diff"`
}

func handleUpdateEvent(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	defer closeRedis(request, conn)
	httpUnauthorizedIf(response, request, err)

	var updateRequest updateEventRequest
	err = readBodyJSON(request, &updateRequest)
	httpInternalErrorIf(response, request, err)

	logf(request,
		"%s requests update %v", sess.PlayerInfo(), updateRequest,
	)
	eventText, err := event.GetByID(sess.GameID, updateRequest.ID, conn)
	httpBadRequestIf(response, request, err)

	evt, err := event.Parse([]byte(eventText))
	httpBadRequestIf(response, request, err)

	if evt.GetPlayerID() != sess.PlayerID {
		httpForbidden(response, request, "You may not update this event.")
	}
	if evt.GetType() == event.EventTypePlayerJoin {
		httpForbidden(response, request, "You may not update this event.")
	}

	logf(request, "Event type %v found, updating", evt.GetType())
	updateTime := id.NewEventID()
	evt.SetEdit(updateTime)
	diff := make(map[string]interface{})
	update := update.ForEventDiff(evt, diff)
	for key, value := range updateRequest.Diff {
		switch key {
		// Title: the player can set the event title.
		case "title":
			title, ok := value.(string)
			if !ok {
				httpBadRequest(response, request, "Event diff: title: expected string")
			}
			// Title is common to many events to be worth type switch
			titleField := reflect.Indirect(reflect.ValueOf(evt)).FieldByName("Title")
			if !titleField.CanSet() {
				httpInternalError(response, request, "Cannot set Title field")
			}
			titleField.SetString(title)
			diff["title"] = title
		case "glitchy":
			glitchy, ok := value.(float64)
			if !ok {
				httpBadRequest(response, request, "Event diff: glitchy: expected int")
			}
			glitchyField := reflect.Indirect(reflect.ValueOf(evt)).FieldByName("Glitchy")
			if !glitchyField.CanSet() {
				httpInternalError(response, request, "Cannot set Glitchy field")
			}
			glitchyField.SetInt(int64(glitchy))
			diff["glitchy"] = glitchy
		}
	}

	logf(request, "Event %v diff %v", evt.GetID(), diff)

	err = game.UpdateEvent(sess.GameID, evt, update, conn)
	httpInternalErrorIf(response, request, err)

	httpSuccess(response, request, "Updated event ", evt.GetID())
}

var _ = gameRouter.HandleFunc("/delete-roll", handleDeleteEvent).Methods("POST")

type deleteEventRequest struct {
	ID int64 `json:"id"`
}

func handleDeleteEvent(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	defer closeRedis(request, conn)
	httpUnauthorizedIf(response, request, err)

	var delete deleteEventRequest
	err = readBodyJSON(request, &delete)
	httpInternalErrorIf(response, request, err)

	logf(request,
		"%v requests to delete %v", sess.PlayerInfo(), delete.ID,
	)
	eventText, err := event.GetByID(sess.GameID, delete.ID, conn)
	httpBadRequestIf(response, request, err)

	evt, err := event.Parse([]byte(eventText))
	httpBadRequestIf(response, request, err)

	if evt.GetPlayerID() != sess.PlayerID {
		httpForbidden(response, request, "You may not delete this event.")
	}
	if evt.GetType() == event.EventTypePlayerJoin {
		httpForbidden(response, request, "You may not delete this event.")
	}

	logf(request,
		"%v deleting %#v", sess.PlayerInfo(), evt,
	)
	err = game.DeleteEvent(sess.GameID, evt.GetID(), conn)
	httpInternalErrorIf(response, request, err)

	httpSuccess(response, request, "Deleted event ", evt.GetID())
}

type rollRequest struct {
	Count   int    `json:"count"`
	Title   string `json:"title"`
	Edge    bool   `json:"edge"`
	Glitchy int    `json:"glitchy"`
}

var _ = gameRouter.HandleFunc("/roll", handleRoll).Methods("POST")

// $ POST /roll count
func handleRoll(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	defer closeRedis(request, conn)
	httpUnauthorizedIf(response, request, err)

	var roll rollRequest
	err = readBodyJSON(request, &roll)
	httpInternalErrorIf(response, request, err)

	if roll.Count < 1 {
		httpBadRequest(response, request, "Invalid roll count")
	}
	if roll.Count > config.MaxSingleRoll {
		httpBadRequest(response, request, "Roll count too high")
	}

	player, err := sess.GetPlayer(conn)
	httpInternalErrorIf(response, request, err)

	var evt event.Event
	// Note that roll generation is possibly blocking
	if roll.Edge {
		rolls := sr.ExplodingSixes(roll.Count)
		logf(request, "%v: edge roll: %v",
			sess.PlayerInfo(), rolls,
		)
		rollEvent := event.ForEdgeRoll(
			player, roll.Title, rolls, roll.Glitchy,
		)
		evt = &rollEvent
	} else {
		dice := make([]int, roll.Count)
		hits := sr.FillRolls(dice)
		logf(request, "%v rolls %v (%v hits)",
			sess.PlayerInfo(), dice, hits,
		)
		rollEvent := event.ForRoll(
			player, roll.Title, dice, roll.Glitchy,
		)
		evt = &rollEvent
	}

	err = game.PostEvent(sess.GameID, evt, conn)
	httpInternalErrorIf(response, request, err)
	httpSuccess(
		response, request,
		"OK; roll ", evt.GetID(), " posted",
	)
}

type initiativeRollRequest struct {
	Title string `json:"title"`
	Base  int    `json:"base"`
	Dice  int    `json:"dice"`
}

var _ = gameRouter.HandleFunc("/roll-initiative", handleRollInitiative).Methods("POST")

// $ POST /roll-initiative title base dice
func handleRollInitiative(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	defer closeRedis(request, conn)
	httpUnauthorizedIf(response, request, err)

	player, err := sess.GetPlayer(conn)
	httpInternalErrorIf(response, request, err)

	var roll initiativeRollRequest
	err = readBodyJSON(request, &roll)
	httpInternalErrorIf(response, request, err)
	displayedTitle := "initiative"
	if roll.Title != "" {
		displayedTitle = roll.Title
	}
	logf(request, "Initiative request from %v to roll %v + %v (%v)",
		sess.String(), roll.Base, roll.Dice, displayedTitle,
	)

	if roll.Dice < 1 {
		httpBadRequest(response, request, "Invalid dice count")
	}
	if roll.Base < 0 {
		httpBadRequest(response, request, "Invalid initiative base")
	}
	if roll.Dice > 5 {
		httpBadRequest(response, request, "Cannot roll more than 5 dice")
	}

	dice := make([]int, roll.Dice)
	sr.FillRolls(dice)

	logf(request, "%v rolls %v + %v for `%v`",
		sess.PlayerInfo(), roll.Base, dice, roll.Title,
	)
	event := event.ForInitiativeRoll(
		player, roll.Title, roll.Base, dice,
	)
	err = game.PostEvent(sess.GameID, &event, conn)
	httpInternalErrorIf(response, request, err)
	httpSuccess(
		response, request,
		"Initiative ", event.GetID(), " posted",
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
	defer closeRedis(request, conn)
	httpUnauthorizedIf(response, request, err)

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

	previousRollText, err := event.GetByID(sess.GameID, reroll.RollID, conn)
	httpInternalErrorIf(response, request, err)
	var previousRoll event.Roll
	err = json.Unmarshal([]byte(previousRollText), &previousRoll)
	if err != nil {
		logf(request, "Expecting to parse previous roll")
		httpBadRequest(response, request, "Invalid previous roll")
	}
	logf(request, "Got previous roll `%v` %v",
		previousRoll.Title, previousRoll.Dice,
	)

	player, err := sess.GetPlayer(conn)
	httpInternalErrorIf(response, request, err)

	if reroll.Type == sr.RerollTypeRerollFailures {
		newRound := sr.RerollFailures(previousRoll.Dice)
		if len(newRound) == 0 {
			// Cannot reroll failures on all hits
			httpBadRequest(response, request, "Invalid previous roll")
		}
		rerolled := event.ForReroll(
			player, &previousRoll, [][]int{newRound, previousRoll.Dice},
		)
		update := update.ForSecondChance(&rerolled, newRound)
		err = game.UpdateEvent(sess.GameID, &rerolled, update, conn)
		httpInternalErrorIf(response, request, err)

		httpSuccess(
			response, request, "Rerolled ", rerolled.ID, newRound,
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
	defer closeRedis(request, conn)

	logf(request, "Player %v to connect to %v", sess.PlayerID, sess.GameID)

	// Upgrade to SSE stream
	stream, err := sseUpgrader.Upgrade(response, request)
	httpInternalErrorIf(response, request, err)
	logf(request, "Upgraded to SSE")

	// Subscribe to redis
	subCtx, cancel := context.WithCancel(request.Context())
	messages, errChan := event.SubscribeToGame(subCtx, sess.GameID)
	logf(request, "Subscription to %v successful", sess.GameID)
	select {
	case firstErr := <-errChan:
		logf(request, "Error initially opening game subscription: %v", firstErr)
		httpInternalErrorIf(response, request, firstErr)
	default:
		// No error connecting
	}

	// Reset session timer, also reset on close
	_, err = sess.Expire(conn)
	httpInternalErrorIf(response, request, err)
	logf(request, "Reset timer for session %v", sess.String())
	defer func() {
		if _, err := sess.Expire(conn); err != nil {
			logf(request, "** Error resetting session timer for %v: %v", sess.String, err)
		} else {
			logf(request, "** Reset session timer for %v", sess.String())
		}
	}()

	pingStream := func() error {
		pingID := fmt.Sprintf("%v", id.NewEventID())
		return stream.WriteEventWithID(pingID, "ping", []byte{})
	}
	err = pingStream()
	if err != nil {
		logf(request, "Unable to write initial ping: %v", err)
		return
	}
	lastPing := time.Now()

	// Begin writing events
	logf(request, "Begin receiving events...")
	ssePingInterval := time.Duration(config.SSEPingSecs) * time.Second
	for {
		const pollInterval = time.Duration(2) * time.Second
		const reexpireInterval = time.Duration(1) * time.Minute
		now := time.Now()
		if !stream.IsOpen() {
			logf(request, "Connection closed by remote host")
			break
		}
		if now.Sub(lastPing) >= ssePingInterval {
			err = pingStream()
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
			var updateLog string
			var messageID string
			if body[0] == "update" {
				messageID = fmt.Sprintf("%v", id.NewEventID())
				updateLog = fmt.Sprintf("update %v", body[1])
			} else {
				messageID = event.ParseID(body[1])
				updateLog = fmt.Sprintf(
					"event %v %v",
					event.ParseTy(body[1]), messageID,
				)
			}
			// channel := body[0] ; message := body[1]
			err = stream.WriteEventWithID(messageID, body[0], []byte(body[1]))
			if err != nil {
				logf(request, "Unable to write %s to stream: %v", messageText, err)
				break
			}
			logf(request, "=> Sent %v to %v", updateLog, sess.PlayerInfo())
		case err := <-errChan:
			logf(request, "=> Error from subscription goroutine: %v", err)
			break
		case <-time.After(pollInterval):
			// Need to recheck stream.IsOpen()
			continue
		}
	}
	cancel()
	dur := removeDecimal.ReplaceAllString(displayRequestDuration(subCtx), "")
	logf(request, ">> Subscription for %v closed (%v)", sess.PlayerInfo(), dur)
	if stream.IsOpen() {
		stream.Close()
	}
}

type eventRangeResponse struct {
	Events []event.Event `json:"events"`
	LastID int64         `json:"lastID"`
	More   bool          `json:"more"`
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
	defer closeRedis(request, conn)
	httpUnauthorizedIf(response, request, err)

	newest := request.FormValue("newest")
	oldest := request.FormValue("oldest")

	// We want to be careful here because these IDs are user input!

	if newest == "" {
		newest = "+inf"
	} else if !event.ValidID(newest) {
		httpBadRequest(response, request, "Invalid newest ID")
	}

	if oldest == "" {
		oldest = "-inf"
	} else if !event.ValidID(oldest) {
		httpBadRequest(response, request, "Invalid oldest ID")
	}

	logf(request, "Retrieve events [%s ... %s] for %s",
		oldest, newest, sess.PlayerInfo(),
	)

	events, err := event.GetBetween(
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
			Events: []event.Event{},
			LastID: 0,
			More:   false,
		}
		message = "0 events"
	} else {
		parsed := make([]event.Event, len(events))
		for i, eventText := range events {
			evt, err := event.Parse([]byte(eventText))
			if err != nil {
				err := fmt.Errorf("error parsing event %v: %w", i, err)
				httpInternalErrorIf(response, request, err)
			}
			parsed[i] = evt
		}
		firstID := parsed[0].GetID()
		lastID := parsed[len(parsed)-1].GetID()

		eventRange = eventRangeResponse{
			Events: parsed,
			LastID: lastID,
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
