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
	defer closeRedis(request, conn)
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

	diff := make(map[string]interface{}, len(requestDiff))
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
			diff["name"] = name
		case "hue":
			hue, ok := value.(float64)
			if !ok || hue < 0 || hue > 360 {
				httpBadRequest(response, request, "hue: expected int 0-360")
			}
			diff["hue"] = int(hue)
		default:
			httpBadRequest(response, request,
				fmt.Sprintf("Cannot update field %v", key),
			)
		}
	}
	logf(request, "Created update %#v", diff)
	update := update.ForPlayerDiff(sess.PlayerID, diff)

	err = game.UpdatePlayer(sess.GameID, sess.PlayerID, update, conn)
	httpInternalErrorIf(response, request, err)
	httpSuccess(response, request,
		"Player ", sess.PlayerID, " update ", diff,
	)
}
