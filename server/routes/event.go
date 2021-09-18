package routes

import (
	"sr/event"
	"sr/game"
	"sr/id"

	"github.com/go-redis/redis/v8"
)

var _ = gameRouter.HandleFunc("/edit-share", Wrap(handleShareEvent)).Methods("POST")

type shareEventRequest struct {
	ID    int64 `json:"id"`
	Share int   `json:"share"`
}

func handleShareEvent(response Response, request *Request, client *redis.Client) {
	sess, ctx, err := requestSession(request, client)
	httpUnauthorizedIf(response, request, err)

	var shareRequest shareEventRequest
	err = readBodyJSON(request, &shareRequest)
	httpInternalErrorIf(response, request, err)

	if !event.IsShare(shareRequest.Share) {
		httpBadRequest(response, request, "Invalid share type")
	}
	share := event.Share(shareRequest.Share)

	logf(request,
		"%v requests to share %v %v",
		sess.PlayerID, shareRequest.ID, share.String(),
	)

	eventText, err := event.GetByID(ctx, client, sess.GameID, shareRequest.ID)
	httpBadRequestIf(response, request, err)
	evt, err := event.Parse([]byte(eventText))
	httpInternalErrorIf(response, request, err)

	if evt.GetPlayerID() != sess.PlayerID {
		httpForbidden(response, request, "You may not edit this event")
	}
	if evt.GetType() == event.EventTypePlayerJoin {
		httpForbidden(response, request, "You may not edit this event")
	}

	// Gotta be idempotent
	if evt.GetShare() == share {
		httpSuccess(response, request, "No change")
		return
	}

	updateTime := id.NewEventID()
	evt.SetEdit(updateTime)

	err = game.UpdateEventShare(ctx, client, sess.GameID, evt, share)
	httpInternalErrorIf(response, request, err)

	httpSuccess(response, request,
		"Event ", evt.GetID(), " is now share ", share.String(),
	)
}
