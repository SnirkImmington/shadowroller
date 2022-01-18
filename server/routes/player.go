package routes

import (
	"strings"

	"shadowroller.net/libsr/errs"
	"sr/game"
	srHTTP "shadowroller.net/libsr/http"
	"sr/log"
	"sr/player"
	"sr/update"

	attr "go.opentelemetry.io/otel/attribute"
)

var playerRouter = RESTRouter.PathPrefix("/player").Subrouter()

type playerUpdateRequest struct {
	Diff map[string]interface{} `json:"diff"`
}

var _ = srHTTP.Handle(playerRouter, "POST /update", handleUpdatePlayer)

func handleUpdatePlayer(args *srHTTP.Args) {
	ctx, response, request, client, sess := args.MustSession()

	var updateRequest playerUpdateRequest
	srHTTP.MustReadBodyJSON(request, &updateRequest)

	requestDiff := updateRequest.Diff
	if len(requestDiff) == 0 {
		srHTTP.Halt(ctx, errs.BadRequestf("empty diff request"))
	}
	log.Printf(ctx,
		"%v requests update %v", sess.PlayerInfo(), updateRequest.Diff,
	)

	externalDiff := make(map[string]interface{}, len(requestDiff))
	internalDiff := make(map[string]interface{})
	fields := make([]string, 0, len(requestDiff))
	for key, value := range requestDiff {
		fields = append(fields, key)
		switch key {
		case "name":
			name, ok := value.(string)
			if !ok {
				srHTTP.Halt(ctx, errs.BadRequestf("name: expected string"))
			}
			name = strings.TrimSpace(name)
			if !player.ValidName(name) {
				srHTTP.Halt(ctx, errs.BadRequestf("name: invalid"))
			}
			externalDiff["name"] = name
			internalDiff["name"] = name
		case "hue":
			hue, ok := value.(float64)
			if !ok || hue < 0 || hue > 360 {
				srHTTP.Halt(ctx, errs.BadRequestf("hue: expected int 0-360"))
			}
			internalDiff["hue"] = int(hue)
			externalDiff["hue"] = int(hue)
		case "onlineMode":
			var mode player.OnlineMode
			modeFloat, ok := value.(float64)
			modeInt := int(modeFloat)
			if !ok || modeInt < player.OnlineModeAuto || modeInt > player.OnlineModeOffline {
				srHTTP.Halt(ctx, errs.BadRequestf("mode: expected auto, online, offline"))
			}
			mode = modeInt

			// Determine if online mode changes player online status
			plr, err := player.GetByID(ctx, client, string(sess.PlayerID))
			srHTTP.HaltInternal(ctx, err)
			previouslyOnline := plr.IsOnline()
			// Change the variable `plr` to see if the change affects IsOnline()
			plr.OnlineMode = mode
			updatedOnline := plr.IsOnline()

			if previouslyOnline != updatedOnline {
				externalDiff["online"] = updatedOnline
			}
			internalDiff["onlineMode"] = mode
		default:
			srHTTP.Halt(ctx, errs.BadRequestf("Cannot update field %v", key))
		}
	}
	log.Printf(ctx, "Created updates %#v and %#v", externalDiff, internalDiff)
	externalUpdate := update.ForPlayerDiff(sess.PlayerID, externalDiff)
	internalUpdate := update.ForPlayerDiff(sess.PlayerID, internalDiff)
	if externalUpdate.IsEmpty() && internalUpdate.IsEmpty() {
		srHTTP.LogSuccess(ctx, "No update was applied")
		return // Idempotent return
	}

	err := game.UpdatePlayer(ctx, client, sess.GameID, sess.PlayerID, externalUpdate, internalUpdate)
	srHTTP.HaltInternal(ctx, err)
	srHTTP.MustWriteBodyJSON(ctx, response, internalDiff)

	log.Event(ctx, "Player update",
		attr.String("sr.player.id", sess.PlayerID.String()),
		attr.StringSlice("sr.update.fields", fields),
	)

	srHTTP.LogSuccessf(ctx, "Player %v update %v", sess.PlayerID, internalDiff)
}
