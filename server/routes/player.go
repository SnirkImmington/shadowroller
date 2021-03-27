package routes

import (
	"fmt"
	"sr/game"
	"sr/player"
	"sr/update"
	"strings"
)

var playerRouter = restRouter.PathPrefix("/player").Subrouter()

var _ = playerRouter.HandleFunc("/update", handleUpdatePlayer).Methods("POST")

type playerUpdateRequest struct {
	Diff map[string]interface{} `json:"diff"`
}

func handleUpdatePlayer(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestSession(request)
	httpUnauthorizedIf(response, request, err)

	var updateRequest playerUpdateRequest
	err = readBodyJSON(request, &updateRequest)
	httpUnauthorizedIf(response, request, err)
	requestDiff := updateRequest.Diff
	if len(requestDiff) == 0 {
		httpBadRequest(response, request, "empty diff request")
	}
	logf(request,
		"%v requests update %v", sess.PlayerInfo(), updateRequest.Diff,
	)

	externalDiff := make(map[string]interface{}, len(requestDiff))
	internalDiff := make(map[string]interface{})
	for key, value := range requestDiff {
		switch key {
		case "name":
			name, ok := value.(string)
			if !ok {
				httpBadRequest(response, request, "name: expected string")
			}
			name = strings.TrimSpace(name)
			if !player.ValidName(name) {
				httpBadRequest(response, request, "name: invalid")
			}
			externalDiff["name"] = name
			internalDiff["name"] = name
		case "hue":
			hue, ok := value.(float64)
			if !ok || hue < 0 || hue > 360 {
				httpBadRequest(response, request, "hue: expected int 0-360")
			}
			internalDiff["hue"] = int(hue)
			externalDiff["hue"] = int(hue)
		case "onlineMode":
			var mode player.OnlineMode
			modeFloat, ok := value.(float64)
			modeInt := int(modeFloat)
			if !ok || modeInt < player.OnlineModeAuto || modeInt > player.OnlineModeOffline {
				httpBadRequest(response, request, "mode: expected auto, online, offline")
			}
			mode = modeInt

			// Determine if online mode changes player online status
			plr, err := player.GetByID(string(sess.PlayerID), conn)
			httpInternalErrorIf(response, request, err)
			previouslyOnline := plr.IsOnline()
			// Change the variable `plr` to see if the change affects IsOnline()
			plr.OnlineMode = mode
			updatedOnline := plr.IsOnline()

			if previouslyOnline != updatedOnline {
				externalDiff["online"] = updatedOnline
			}
			internalDiff["onlineMode"] = mode
		default:
			httpBadRequest(response, request,
				fmt.Sprintf("Cannot update field %v", key),
			)
		}
	}
	logf(request, "Created updates %#v and %#v", externalDiff, internalDiff)
	externalUpdate := update.ForPlayerDiff(sess.PlayerID, externalDiff)
	internalUpdate := update.ForPlayerDiff(sess.PlayerID, internalDiff)
	if externalUpdate.IsEmpty() && internalUpdate.IsEmpty() {
		httpBadRequest(response, request, "No update made?")
	}

	err = game.UpdatePlayer(sess.GameID, sess.PlayerID, externalUpdate, internalUpdate, conn)
	httpInternalErrorIf(response, request, err)
	err = writeBodyJSON(response, internalDiff)
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request,
		"Player ", sess.PlayerID, " update ", internalDiff,
	)
}
