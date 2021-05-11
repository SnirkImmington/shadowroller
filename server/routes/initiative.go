package routes

import (
	"math"
	"sr/event"
	"sr/game"
	"sr/id"
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

var _ = gameRouter.HandleFunc("/roll-initiative", handleRollInitiative).Methods("POST")

// $ POST /roll-initiative title base dice
func handleRollInitiative(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	httpUnauthorizedIf(response, request, err)

	var initRequest initiativeRollRequest
	err = readBodyJSON(request, &initRequest)
	httpInternalErrorIf(response, request, err)
	if initRequest.Dice < 1 {
		httpBadRequest(response, request, "Invalid dice count")
	}
	if initRequest.Base < -2 {
		httpBadRequest(response, request, "Invalid initiative base")
	}
	if initRequest.Dice > 5 {
		httpBadRequest(response, request, "Cannot roll more than 5 dice")
	}
	if initRequest.Blitzed {
		initRequest.Dice = 5
	}
	if !event.IsShare(initRequest.Share) {
		httpBadRequest(response, request, "share: invalid")
	}
	share := event.Share(initRequest.Share)

	logf(request, "%v to roll %v + %vd6 %v (blitz = %v, seize = %v) %v",
		sess.PlayerID, initRequest.Base, initRequest.Dice, share.String(), initRequest.Blitzed, initRequest.Seized, initRequest.Title,
	)

	player, err := sess.GetPlayer(conn)
	httpInternalErrorIf(response, request, err)

	dice := make([]int, initRequest.Dice)
	roll.Rolls.Fill(request.Context(), dice)
	logf(request, "Rolled %v + %v = %v", initRequest.Base, dice, initRequest.Base+roll.SumDice(dice))

	event := event.ForInitiativeRoll(
		player, share, initRequest.Title, initRequest.Base, dice, initRequest.Seized, initRequest.Blitzed,
	)
	err = game.PostEvent(sess.GameID, &event, conn)
	httpInternalErrorIf(response, request, err)
	httpSuccess(
		response, request,
		"Initiative ", event.GetID(), " posted",
	)
}

var _ = gameRouter.HandleFunc("/edit-initiative", handleEditInitiative).Methods("POST")

func handleEditInitiative(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	httpUnauthorizedIf(response, request, err)

	var updateRequest updateEventRequest
	err = readBodyJSON(request, &updateRequest)
	httpInternalErrorIf(response, request, err)

	if len(updateRequest.Diff) == 0 {
		httpBadRequest(response, request, "No diff requested")
	}

	logf(request, "%s wants to update %v", sess.PlayerInfo(), updateRequest.ID)

	eventText, err := event.GetByID(sess.GameID, updateRequest.ID, conn)
	httpBadRequestIf(response, request, err)

	evt, err := event.Parse([]byte(eventText))
	httpBadRequestIf(response, request, err)

	if evt.GetType() != event.EventTypeInitiativeRoll {
		httpForbidden(response, request, "Invalid event type.")
	}
	if evt.GetPlayerID() != sess.PlayerID {
		httpForbidden(response, request, "You may not update this event.")
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
				httpBadRequest(response, request, "title: expected string")
			}
			if title == initEvent.Title {
				continue
			}
			initEvent.Title = title
			diff["title"] = title
		case "base":
			base, ok := value.(float64)
			if !ok || base < -2 || base > 50 || math.Round(base) != base {
				httpBadRequest(response, request, "base: expected number between -2 and 50")
			}
			baseVal := int(base)
			if baseVal == initEvent.Base {
				continue
			}
			initEvent.Base = baseVal
			diff["base"] = base
		case "dice":
			httpBadRequest(response, request, "Cannot set dice at this time")
		case "seized":
			seized, ok := value.(bool)
			if !ok {
				httpBadRequest(response, request, "seized: can only be unset")
			}
			if initEvent.Seized == seized {
				continue
			}
			initEvent.Seized = seized
			diff["seized"] = seized
		case "blitzed":
			httpBadRequest(response, request, "blitzed: cannot set")
		default:
			httpBadRequest(response, request, "cannot set")
		}
	}
	if len(diff) == 0 {
		httpSuccess(response, request, "(Idempotent, no changes made)")
	}
	update := update.ForEventDiff(initEvent, diff)
	logf(request, "Found diff %v", diff)
	err = game.UpdateEvent(sess.GameID, initEvent, update, conn)
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request, "Update sent")
}
