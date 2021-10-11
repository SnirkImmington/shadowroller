package routes

import (
	"encoding/json"
	"fmt"
	"reflect"

	"sr/config"
	"sr/errs"
	"sr/event"
	"sr/game"
	srHTTP "sr/http"
	"sr/id"
	"sr/log"
	"sr/player"
	"sr/roll"
	"sr/update"

	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/semconv/v1.4.0"
)

var gameRouter = RESTRouter.PathPrefix("/game").Subrouter()

// GET /info {gameInfo}
var _ = srHTTP.Handle(gameRouter, "GET /info", handleInfo)

func handleInfo(args *srHTTP.Args) {
	ctx, response, _, client, sess := args.MustSession()

	info, err := game.GetInfo(ctx, client, sess.GameID)
	srHTTP.HaltInternal(ctx, err)

	srHTTP.MustWriteBodyJSON(ctx, response, &info)
	srHTTP.LogSuccessf(ctx, "%v: %v players",
		info.ID, len(info.Players),
	)
}

type renameRequest struct {
	Name string `json:"name"`
}

var _ = srHTTP.Handle(gameRouter, "POST /modify-roll", handleUpdateEvent)

func handleUpdateEvent(args *srHTTP.Args) {
	ctx, _, request, client, sess := args.MustSession()

	var updateRequest updateEventRequest
	srHTTP.MustReadBodyJSON(request, &updateRequest)

	log.Printf(ctx,
		"%s requests update %v", sess.PlayerInfo(), updateRequest,
	)
	eventText, err := event.GetByID(ctx, client, sess.GameID, updateRequest.ID)
	srHTTP.Halt(ctx, errs.BadRequest(err))

	evt, err := event.Parse([]byte(eventText))
	srHTTP.Halt(ctx, errs.BadRequest(err))

	if evt.GetPlayerID() != sess.PlayerID {
		srHTTP.Halt(ctx, errs.NoAccessf("You may not update this event"))
	}
	if evt.GetType() == event.EventTypePlayerJoin {
		srHTTP.Halt(ctx, errs.NoAccessf("You may not update this event"))
	}

	log.Printf(ctx, "Event type %v found, updating", evt.GetType())
	updateTime := id.NewEventID()
	evt.SetEdit(updateTime)
	diff := make(map[string]interface{})
	for key, value := range updateRequest.Diff {
		switch key {
		// Title: the player can set the event title.
		case "title":
			title, ok := value.(string)
			if !ok {
				srHTTP.Halt(ctx, errs.BadRequestf("Event diff: title: expected string"))
			}
			// Title is common to many events to be worth type switch
			titleField := reflect.Indirect(reflect.ValueOf(evt)).FieldByName("Title")
			if !titleField.CanSet() {
				srHTTP.Halt(ctx, errs.Internalf("could not set Title field"))
			}
			titleField.SetString(title)
			diff["title"] = title
		case "glitchy":
			glitchy, ok := value.(float64)
			if !ok {
				srHTTP.Halt(ctx, errs.BadRequestf("event diff: glitchy: expected int"))
			}
			glitchyField := reflect.Indirect(reflect.ValueOf(evt)).FieldByName("Glitchy")
			if !glitchyField.CanSet() {
				srHTTP.Halt(ctx, errs.Internalf("could not set Glitchy field"))
			}
			glitchyField.SetInt(int64(glitchy))
			diff["glitchy"] = glitchy
		case "share":
			srHTTP.Halt(ctx, errs.BadRequestf("event diff: cannot update share here"))
		default:
			log.Printf(ctx, "Received unknown value %v = %v", key, value)
		}
	}
	update := update.ForEventDiff(evt, diff)

	log.Printf(ctx, "Event %v diff %v", evt.GetID(), diff)
	err = game.UpdateEvent(ctx, client, sess.GameID, evt, update)
	srHTTP.HaltInternal(ctx, err)
}

type deleteEventRequest struct {
	ID int64 `json:"id"`
}

var _ = srHTTP.Handle(gameRouter, "POST /delete-roll", handleDeleteEvent)

func handleDeleteEvent(args *srHTTP.Args) {
	ctx, _, request, client, sess := args.MustSession()

	var delete deleteEventRequest
	srHTTP.MustReadBodyJSON(request, &delete)

	log.Printf(ctx,
		"%v requests to delete %v", sess.PlayerInfo(), delete.ID,
	)
	eventText, err := event.GetByID(ctx, client, sess.GameID, delete.ID)
	srHTTP.Halt(ctx, errs.BadRequest(err))

	evt, err := event.Parse([]byte(eventText))
	srHTTP.Halt(ctx, errs.BadRequest(err))

	if evt.GetPlayerID() != sess.PlayerID {
		srHTTP.Halt(ctx, errs.NoAccessf("You may not delete this event."))
	}
	if evt.GetType() == event.EventTypePlayerJoin {
		srHTTP.Halt(ctx, errs.NoAccessf("You may not delete this event."))
	}

	log.Printf(ctx,
		"%v deleting event %v", sess.PlayerInfo(), delete.ID,
	)
	err = game.DeleteEvent(ctx, client, sess.GameID, evt)
	srHTTP.HaltInternal(ctx, err)

	srHTTP.LogSuccessf(ctx, "Deleted event %v", evt.GetID())
}

type rollRequest struct {
	Count   int    `json:"count"`
	Title   string `json:"title"`
	Share   int    `json:"share"`
	Edge    bool   `json:"edge"`
	Glitchy int    `json:"glitchy"`
}

// $ POST /roll count
var _ = srHTTP.Handle(gameRouter, "POST /roll", handleRoll)

func handleRoll(args *srHTTP.Args) {
	ctx, _, request, client, sess := args.MustSession()

	var rollRequest rollRequest
	srHTTP.MustReadBodyJSON(request, &rollRequest)

	if rollRequest.Count < 1 {
		srHTTP.Halt(ctx, errs.BadRequestf("Invalid roll count"))
	}
	if rollRequest.Count > config.MaxSingleRoll {
		srHTTP.Halt(ctx, errs.BadRequestf("Roll count too high"))
	}
	if !event.IsShare(rollRequest.Share) {
		srHTTP.Halt(ctx, errs.BadRequestf("share: invalid"))
	}
	share := event.Share(rollRequest.Share)

	player, err := player.GetByID(ctx, client, string(sess.PlayerID))
	srHTTP.HaltInternal(ctx, err)

	var evt event.Event
	if rollRequest.Edge {
		rolls, hits, err := roll.Rolls.ExplodingSixes(request.Context(), rollRequest.Count)
		srHTTP.HaltInternal(ctx, err)
		log.Event(ctx, "edge roll",
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
		srHTTP.HaltInternal(ctx, err)
		log.Event(ctx, "roll",
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
	srHTTP.HaltInternal(ctx, err)
	srHTTP.LogSuccessf(ctx, "Roll %v posted", evt.GetID())
}

type rerollRequest struct {
	RollID int64  `json:"rollID"`
	Type   string `json:"rerollType"`
}

var _ = srHTTP.Handle(gameRouter, "POST /reroll", handleReroll)

func handleReroll(args *srHTTP.Args) {
	ctx, _, request, client, sess := args.MustSession()

	var reroll rerollRequest
	srHTTP.MustReadBodyJSON(request, &reroll)

	if !event.ValidRerollType(reroll.Type) {
		log.Printf(ctx, "Got invalid roll type %v", reroll)
		srHTTP.Halt(ctx, errs.BadRequestf("Invalid reroll type"))
	}
	log.Printf(ctx, "Rerolling roll %v from %v",
		reroll.RollID, sess.PlayerInfo(),
	)

	previousRollText, err := event.GetByID(ctx, client, sess.GameID, reroll.RollID)
	srHTTP.HaltInternal(ctx, err)
	previousRollType := event.ParseTy(previousRollText)
	if previousRollType != "roll" {
		srHTTP.Halt(ctx, errs.BadRequestf("Invalid previous roll type"))
	}

	var previousRoll event.Roll
	err = json.Unmarshal([]byte(previousRollText), &previousRoll)
	if err != nil {
		log.Printf(ctx, "Expecting to parse previous roll")
		srHTTP.Halt(ctx, errs.BadRequestf("Invalid previous roll"))
	}
	if previousRoll.PlayerID != sess.PlayerID {
		srHTTP.Halt(ctx, errs.BadRequestf("That is not your roll"))
	}
	log.Printf(ctx, "Got previous roll `%v` %v",
		previousRoll.Title, previousRoll.Dice,
	)

	newRound, totalHits, err := roll.Rolls.RerollMisses(request.Context(), previousRoll.Dice)
	srHTTP.HaltInternal(ctx, err)
	if len(newRound) == 0 {
		// Cannot reroll failures on all hits
		srHTTP.Halt(ctx, errs.BadRequestf("Invalid previous roll"))
	}
	log.Printf(ctx, "Rerolled %v, %v hits total", newRound, totalHits)

	player, err := player.GetByID(ctx, client, string(sess.PlayerID))
	srHTTP.HaltInternal(ctx, err)

	rerolled := event.ForReroll(
		player, &previousRoll, [][]int{newRound, previousRoll.Dice},
	)
	// Rerolls are getting their own IDs. We should instead just swap dice with rounds.
	err = game.DeleteEvent(ctx, client, sess.GameID, &previousRoll)
	srHTTP.HaltInternal(ctx, err)
	err = game.PostEvent(ctx, client, sess.GameID, &rerolled)
	srHTTP.HaltInternal(ctx, err)

	srHTTP.LogSuccessf(ctx, "Rerolled %v", rerolled.ID)
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

/*
   on join: { start: '', end: <lastEventID> }, backfill buffer
  -> [ {id: <some-early-id>, ... } ]
  if there's < max responses, client knows it's hit the boundary.
*/
// GET /event-range { start: <id>, end: <id>, max: int }
var _ = srHTTP.Handle(gameRouter, "GET /events", handleEvents)

func handleEvents(args *srHTTP.Args) {
	ctx, response, request, client, sess := args.MustSession()

	newest := request.FormValue("newest")
	oldest := request.FormValue("oldest")

	// We want to be careful here because these IDs are user input!

	if newest == "" {
		newest = "+inf"
	} else if !event.ValidID(newest) {
		srHTTP.Halt(ctx, errs.BadRequestf("Invalid newest ID"))
	}

	if oldest == "" {
		oldest = "-inf"
	} else if !event.ValidID(oldest) {
		srHTTP.Halt(ctx, errs.BadRequestf("Invalid oldest ID"))
	}

	log.Printf(ctx, "Retrieve events [%s ... %s] for %s",
		oldest, newest, sess.PlayerInfo(),
	)

	plr, err := player.GetByID(ctx, client, string(sess.PlayerID))
	srHTTP.HaltInternal(ctx, err)
	events, err := event.GetBetween(ctx, client,
		sess.GameID, newest, oldest, config.MaxEventRange,
	)
	srHTTP.HaltInternal(ctx, err)
	isGM, err := game.HasGM(ctx, client, sess.GameID, sess.PlayerID)
	srHTTP.HaltInternal(ctx, err)

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
				srHTTP.HaltInternal(ctx, err)
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

	srHTTP.MustWriteBodyJSON(ctx, response, eventRange)
	srHTTP.LogSuccess(ctx, message)
}
