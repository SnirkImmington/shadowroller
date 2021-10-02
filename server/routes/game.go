package routes

import (
	"encoding/json"
	"fmt"
	"reflect"

	"sr/config"
	"sr/event"
	"sr/game"
	"sr/id"
	"sr/player"
	"sr/roll"
	"sr/update"

	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/semconv/v1.4.0"

	"github.com/go-redis/redis/v8"
)

var gameRouter = restRouter.PathPrefix("/game").Subrouter()

var _ = gameRouter.HandleFunc("/info", Wrap(handleInfo)).Methods("GET")

// GET /info {gameInfo}
func handleInfo(response Response, request *Request, client *redis.Client) {
	sess, ctx, err := requestSession(request, client)
	httpUnauthorizedIf(response, request, err)

	info, err := game.GetInfo(ctx, client, sess.GameID)
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

var _ = gameRouter.HandleFunc("/modify-roll", Wrap(handleUpdateEvent)).Methods("POST")

func handleUpdateEvent(response Response, request *Request, client *redis.Client) {
	sess, ctx, err := requestSession(request, client)
	httpUnauthorizedIf(response, request, err)

	var updateRequest updateEventRequest
	err = readBodyJSON(request, &updateRequest)
	httpInternalErrorIf(response, request, err)

	logf(request,
		"%s requests update %v", sess.PlayerInfo(), updateRequest,
	)
	eventText, err := event.GetByID(ctx, client, sess.GameID, updateRequest.ID)
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
		case "share":
			httpBadRequest(response, request, "Event diff: cannot update share here")
		default:
			logf(request, "Received unknown value %v = %v", key, value)
		}
	}
	update := update.ForEventDiff(evt, diff)

	logf(request, "Event %v diff %v", evt.GetID(), diff)
	err = game.UpdateEvent(ctx, client, sess.GameID, evt, update)
	httpInternalErrorIf(response, request, err)
}

var _ = gameRouter.HandleFunc("/delete-roll", Wrap(handleDeleteEvent)).Methods("POST")

type deleteEventRequest struct {
	ID int64 `json:"id"`
}

func handleDeleteEvent(response Response, request *Request, client *redis.Client) {
	sess, ctx, err := requestSession(request, client)
	httpUnauthorizedIf(response, request, err)

	var delete deleteEventRequest
	err = readBodyJSON(request, &delete)
	httpInternalErrorIf(response, request, err)

	logf(request,
		"%v requests to delete %v", sess.PlayerInfo(), delete.ID,
	)
	eventText, err := event.GetByID(ctx, client, sess.GameID, delete.ID)
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
		"%v deleting event %v", sess.PlayerInfo(), delete.ID,
	)
	err = game.DeleteEvent(ctx, client, sess.GameID, evt)
	httpInternalErrorIf(response, request, err)

	httpSuccess(response, request, "Deleted event ", evt.GetID())
}

type rollRequest struct {
	Count   int    `json:"count"`
	Title   string `json:"title"`
	Share   int    `json:"share"`
	Edge    bool   `json:"edge"`
	Glitchy int    `json:"glitchy"`
}

var _ = gameRouter.HandleFunc("/roll", Wrap2(handleRoll)).Methods("POST")

// $ POST /roll count
func handleRoll(args *Args) {
	ctx, response, request, client, _ := args.Get()
	sess, ctx, err := requestSession(request, client)
	httpUnauthorizedIf(response, request, err)

	var rollRequest rollRequest
	err = readBodyJSON(request, &rollRequest)
	httpInternalErrorIf(response, request, err)

	if rollRequest.Count < 1 {
		httpBadRequest(response, request, "Invalid roll count")
	}
	if rollRequest.Count > config.MaxSingleRoll {
		httpBadRequest(response, request, "Roll count too high")
	}
	if !event.IsShare(rollRequest.Share) {
		httpBadRequest(response, request, "share: invalid")
	}
	share := event.Share(rollRequest.Share)

	player, err := player.GetByID(ctx, client, string(sess.PlayerID))
	httpInternalErrorIf(response, request, err)

	var evt event.Event
	if rollRequest.Edge {
		rolls, hits, err := roll.Rolls.ExplodingSixes(request.Context(), rollRequest.Count)
		httpInternalErrorIf(response, request, err)
		logEvent(ctx, "edge roll",
			semconv.EnduserIDKey.String(sess.PlayerID.String()),
			attr.String("sr.event.share", share.String()),
			attr.Int("sr.roll.pool", rollRequest.Count),
			attr.IntSlice("sr.roll.dice", roll.FlatMap(rolls)),
			attr.Int("sr.roll.glitchy", rollRequest.Glitchy),
			attr.Int("sr.roll.hits", hits),
		)
		rollEvent := event.ForEdgeRoll(
			player, share, rollRequest.Title, rolls, rollRequest.Glitchy,
		)
		evt = &rollEvent
	} else {
		dice := make([]int, rollRequest.Count)
		hits, err := roll.Rolls.Fill(request.Context(), dice)
		httpInternalErrorIf(response, request, err)
		logEvent(ctx, "roll",
			semconv.EnduserIDKey.String(sess.PlayerID.String()),
			attr.String("sr.event.share", share.String()),
			attr.IntSlice("sr.roll.dice", dice),
			attr.Int("sr.roll.glitchy", rollRequest.Glitchy),
			attr.Int("sr.roll.hits", hits),
		)
		rollEvent := event.ForRoll(
			player, share, rollRequest.Title, dice, rollRequest.Glitchy,
		)
		evt = &rollEvent
	}
	err = game.PostEvent(ctx, client, sess.GameID, evt)
	httpInternalErrorIf(response, request, err)
	httpSuccess(
		response, request,
		"OK; roll ", evt.GetID(), " posted",
	)
}

type rerollRequest struct {
	RollID int64  `json:"rollID"`
	Type   string `json:"rerollType"`
}

var _ = gameRouter.HandleFunc("/reroll", Wrap2(handleReroll)).Methods("POST")

func handleReroll(args *Args) {
	ctx, response, request, client, _ := args.Get()
	sess, err := requestSession2(request, client)
	httpUnauthorizedIf(response, request, err)

	var reroll rerollRequest
	err = readBodyJSON(request, &reroll)
	httpInternalErrorIf(response, request, err)

	if !event.ValidRerollType(reroll.Type) {
		logf2(ctx, "Got invalid roll type %v", reroll)
		httpBadRequest(response, request, "Invalid reroll type")
	}
	logf2(ctx, "Rerolling roll %v from %v",
		reroll.RollID, sess.PlayerInfo(),
	)

	previousRollText, err := event.GetByID(ctx, client, sess.GameID, reroll.RollID)
	httpInternalErrorIf(response, request, err)
	previousRollType := event.ParseTy(previousRollText)
	if previousRollType != "roll" {
		httpBadRequest(response, request, "Invalid previous roll type")
	}

	var previousRoll event.Roll
	err = json.Unmarshal([]byte(previousRollText), &previousRoll)
	if err != nil {
		logf(request, "Expecting to parse previous roll")
		httpBadRequest(response, request, "Invalid previous roll")
	}
	if previousRoll.PlayerID != sess.PlayerID {
		httpBadRequest(response, request, "That is not your roll")
	}
	logf(request, "Got previous roll `%v` %v",
		previousRoll.Title, previousRoll.Dice,
	)

	newRound, totalHits, err := roll.Rolls.RerollMisses(request.Context(), previousRoll.Dice)
	httpInternalErrorIf(response, request, err)
	if len(newRound) == 0 {
		// Cannot reroll failures on all hits
		httpBadRequest(response, request, "Invalid previous roll")
	}
	logf(request, "Rerolled %v, %v hits total", newRound, totalHits)

	player, err := player.GetByID(ctx, client, string(sess.PlayerID))
	httpInternalErrorIf(response, request, err)

	rerolled := event.ForReroll(
		player, &previousRoll, [][]int{newRound, previousRoll.Dice},
	)
	// Rerolls are getting their own IDs. We should instead just swap dice with rounds.
	err = game.DeleteEvent(ctx, client, sess.GameID, &previousRoll)
	httpInternalErrorIf(response, request, err)
	err = game.PostEvent(ctx, client, sess.GameID, &rerolled)
	httpInternalErrorIf(response, request, err)

	httpSuccess(
		response, request, "Rerolled ", rerolled.ID, newRound,
	)
}

func collectRolls(in interface{}) ([]int, error) {
	rolls, ok := in.([]interface{})
	if !ok {
		return nil, fmt.Errorf("unable to assert %v as []interface{}", in)
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

type eventRangeResponse struct {
	Events []event.Event `json:"events"`
	LastID int64         `json:"lastID"`
	More   bool          `json:"more"`
}

var _ = gameRouter.HandleFunc("/events", Wrap(handleEvents)).Methods("GET")

/*
   on join: { start: '', end: <lastEventID> }, backfill buffer
  -> [ {id: <some-early-id>, ... } ]
  if there's < max responses, client knows it's hit the boundary.
*/
// GET /event-range { start: <id>, end: <id>, max: int }
func handleEvents(response Response, request *Request, client *redis.Client) {
	sess, ctx, err := requestSession(request, client)
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

	plr, err := player.GetByID(ctx, client, string(sess.PlayerID))
	httpInternalErrorIf(response, request, err)
	events, err := event.GetBetween(ctx, client,
		sess.GameID, newest, oldest, config.MaxEventRange,
	)
	httpInternalErrorIf(response, request, err)
	isGM, err := game.HasGM(ctx, client, sess.GameID, sess.PlayerID)
	httpInternalErrorIf(response, request, err)

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
		var parsed []event.Event
		for i, eventText := range events {
			evt, err := event.Parse([]byte(eventText))
			if err != nil {
				err := fmt.Errorf("error parsing event %v: %w", i, err)
				httpInternalErrorIf(response, request, err)
			}
			if !game.PlayerCanSeeEvent(plr, isGM, evt) {
				continue
			}
			parsed = append(parsed, evt)
		}
		if len(parsed) == 0 {
			eventRange = eventRangeResponse{
				Events: []event.Event{},
				LastID: 0,
				More:   false,
			}
			message = "0 events"
		} else {
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
	}

	err = writeBodyJSON(response, eventRange)
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request, message)
}
