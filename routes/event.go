package routes

import (
	"sr/event"
	"sr/game"
)

var _ = gameRouter.HandleFunc("/edit-share", handleShareEvent).Methods("POST")

type shareEventRequest struct {
	ID    int64 `json:"id"`
	Share int   `json:"share"`
}

func handleShareEvent(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
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

	eventText, err := event.GetByID(sess.GameID, shareRequest.ID, conn)
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

	err = game.UpdateEventShare(sess.GameID, evt, share, conn)
	httpInternalErrorIf(response, request, err)

	httpSuccess(response, request,
		"Event ", evt.GetID(), " is now share ", share.String(),
	)
}
