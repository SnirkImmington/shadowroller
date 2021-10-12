package routes

import (
	"sr/errs"
	"sr/event"
	"sr/game"
	srHTTP "sr/http"
	"sr/id"
	"sr/log"

	attr "go.opentelemetry.io/otel/attribute"
)

type shareEventRequest struct {
	ID    int64 `json:"id"`
	Share int   `json:"share"`
}

var _ = srHTTP.Handle(gameRouter, "POST /edit-share", handleShareEvent)

func handleShareEvent(args *srHTTP.Args) {
	ctx, _, request, client, sess := args.MustSession()

	var shareRequest shareEventRequest
	srHTTP.MustReadBodyJSON(request, &shareRequest)

	if !event.IsShare(shareRequest.Share) {
		srHTTP.Halt(ctx, errs.BadRequestf("Invalid share type"))
	}
	share := event.Share(shareRequest.Share)

	log.Printf(ctx,
		"%v requests to share %v %v",
		sess.PlayerID, shareRequest.ID, share.String(),
	)

	eventText, err := event.GetByID(ctx, client, sess.GameID, shareRequest.ID)
	srHTTP.Halt(ctx, errs.BadRequest(err))
	evt, err := event.Parse([]byte(eventText))
	srHTTP.HaltInternal(ctx, err)

	if evt.GetPlayerID() != sess.PlayerID {
		srHTTP.Halt(ctx, errs.NoAccessf("You may not edit this event"))
	}
	if evt.GetType() == event.EventTypePlayerJoin {
		srHTTP.Halt(ctx, errs.NoAccessf("You may not edit this event"))
	}

	// Gotta be idempotent
	if evt.GetShare() == share {
		srHTTP.LogSuccess(ctx, "No change")
		return
	}

	updateTime := id.NewEventID()
	evt.SetEdit(updateTime)

	err = game.UpdateEventShare(ctx, client, sess.GameID, evt, share)
	srHTTP.HaltInternal(ctx, err)

	log.Event(ctx, "Event share changed",
		attr.Int64("sr.event.id", evt.GetID()),
	)

	srHTTP.LogSuccessf(ctx, "Event %v is not share %v",
		evt.GetID(), share.String(),
	)
}
