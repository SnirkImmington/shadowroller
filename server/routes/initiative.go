package routes

import (
	"math"

	"sr/errs"
	"sr/event"
	"sr/game"
	srHTTP "sr/http"
	"sr/id"
	"sr/log"
	"sr/player"
	"sr/roll"
	"sr/update"
)

type initiativeRollRequest struct {
	Title   string `json:"title"`
	Share   int    `json:"share"`
	Base    int    `json:"base"`
	Dice    int    `json:"dice"`
	Seized  bool   `json:"seized"`
	Blitzed bool   `json:"blitzed"`
}

// $ POST /roll-initiative title base dice
var _ = srHTTP.Handle(gameRouter, "POST /roll-initiative", handleRollInitiative)

func handleRollInitiative(args *srHTTP.Args) {
	ctx, _, request, client, sess := args.MustSession()

	var initRequest initiativeRollRequest
	srHTTP.MustReadBodyJSON(request, &initRequest)

	if initRequest.Dice < 1 {
		srHTTP.Halt(ctx, errs.BadRequestf("Invalid dice count"))
	}
	if initRequest.Base < -2 {
		srHTTP.Halt(ctx, errs.BadRequestf("Invalid initiative base"))
	}
	if initRequest.Dice > 5 {
		srHTTP.Halt(ctx, errs.BadRequestf("Cannot roll more than 5 dice"))
	}
	if initRequest.Blitzed {
		initRequest.Dice = 5
	}
	if !event.IsShare(initRequest.Share) {
		srHTTP.Halt(ctx, errs.BadRequestf("share: invalid"))
	}
	share := event.Share(initRequest.Share)

	log.Printf(ctx, "%v to roll %v + %vd6 %v (blitz = %v, seize = %v) %v",
		sess.PlayerID, initRequest.Base, initRequest.Dice, share.String(), initRequest.Blitzed, initRequest.Seized, initRequest.Title,
	)

	plr, err := player.GetByID(ctx, client, string(sess.PlayerID))
	srHTTP.HaltInternal(ctx, err)

	dice := make([]int, initRequest.Dice)
	roll.Rolls.Fill(request.Context(), dice)
	log.Printf(ctx, "Rolled %v + %v = %v", initRequest.Base, dice, initRequest.Base+roll.SumDice(dice))

	event := event.ForInitiativeRoll(
		plr, share, initRequest.Title, initRequest.Base, dice, initRequest.Seized, initRequest.Blitzed,
	)
	err = game.PostEvent(ctx, client, sess.GameID, &event)
	srHTTP.HaltInternal(ctx, err)
	srHTTP.LogSuccessf(ctx, "Initiative %v posted", event.GetID())
}

var _ = srHTTP.Handle(gameRouter, "POST /edit-initiative", handleEditInitiative)

func handleEditInitiative(args *srHTTP.Args) {
	ctx, _, request, client, sess := args.MustSession()

	var updateRequest updateEventRequest
	srHTTP.MustReadBodyJSON(request, &updateRequest)

	if len(updateRequest.Diff) == 0 {
		srHTTP.Halt(ctx, errs.BadRequestf("No diff requested"))
	}

	log.Printf(ctx, "%s wants to update %v", sess.PlayerInfo(), updateRequest.ID)

	eventText, err := event.GetByID(ctx, client, sess.GameID, updateRequest.ID)
	srHTTP.Halt(ctx, errs.BadRequest(err))

	evt, err := event.Parse([]byte(eventText))
	srHTTP.Halt(ctx, errs.BadRequest(err))

	if evt.GetType() != event.EventTypeInitiativeRoll {
		srHTTP.Halt(ctx, errs.NoAccessf("Invalid event type."))
	}
	if evt.GetPlayerID() != sess.PlayerID {
		srHTTP.Halt(ctx, errs.NoAccessf("You may not update this event."))
	}

	initEvent := evt.(*event.InitiativeRoll)
	updateTime := id.NewEventID()
	initEvent.SetEdit(updateTime)
	diff := make(map[string]interface{})
	for key, value := range updateRequest.Diff {
		switch key {
		case "title":
			title, ok := value.(string)
			if !ok {
				srHTTP.Halt(ctx, errs.BadRequestf("title: expected string"))
			}
			if title == initEvent.Title {
				continue
			}
			initEvent.Title = title
			diff["title"] = title
		case "base":
			base, ok := value.(float64)
			if !ok || base < -2 || base > 50 || math.Round(base) != base {
				srHTTP.Halt(ctx, errs.BadRequestf("base: expected number between -2 and 50"))
			}
			baseVal := int(base)
			if baseVal == initEvent.Base {
				continue
			}
			initEvent.Base = baseVal
			diff["base"] = base
		case "dice":
			srHTTP.Halt(ctx, errs.BadRequestf("Cannot set dice at this time"))
		case "seized":
			seized, ok := value.(bool)
			if !ok {
				srHTTP.Halt(ctx, errs.BadRequestf("seized: can only be unset"))
			}
			if initEvent.Seized == seized {
				continue
			}
			initEvent.Seized = seized
			diff["seized"] = seized
		case "blitzed":
			srHTTP.Halt(ctx, errs.BadRequestf("blitzed: cannot set"))
		default:
			srHTTP.Halt(ctx, errs.BadRequestf("cannot set"))
		}
	}
	if len(diff) == 0 {
		srHTTP.LogSuccess(ctx, "(Idempotent, no changes made)")
	}
	update := update.ForEventDiff(initEvent, diff)
	log.Printf(ctx, "Found diff %v", diff)
	err = game.UpdateEvent(ctx, client, sess.GameID, initEvent, update)
	srHTTP.HaltInternal(ctx, err)

	srHTTP.LogSuccess(ctx, "Update sent")
}
