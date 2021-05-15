package routes

import (
	"context"
	"fmt"
	"regexp"
	"sr/config"
	"sr/game"
	"sr/id"
	"sr/player"
	"sr/shutdownHandler"
	"sr/update"
	"time"

	"github.com/janberktold/sse"
)

func pingStream(stream *sse.Conn) error {
	return stream.WriteEvent("ping", []byte{})
}

func writeUpdateToStream(channel string, updateText string, stream *sse.Conn) error {
	messageID := id.NewEventID()
	return stream.WriteEventWithID(fmt.Sprintf("%v", messageID), channel, []byte(updateText))
}

var removeDecimal = regexp.MustCompile(`\.\d+`)

var _ = gameRouter.HandleFunc("/subscription", handleSubscription)

func handleSubscription(response Response, request *Request) {
	logRequest(request)
	sess, conn, err := requestParamSession(request)
	httpUnauthorizedIf(response, request, err)
	logf(request, "Player %v to connect to %v", sess.PlayerID, sess.GameID)

	isGM, err := game.HasGM(sess.GameID, sess.PlayerID, conn)
	httpInternalErrorIf(response, request, err)

	// Get shutdown handler first so it defers after everything else
	client := shutdownHandler.MakeClient(fmt.Sprintf("request %02x subscription", requestID(request.Context())))
	defer client.Close()

	// Upgrade to SSE stream
	stream, err := sseUpgrader.Upgrade(response, request)
	httpBadRequestIf(response, request, err)
	logf(request, "Upgraded to SSE")
	defer func() {
		if stream.IsOpen() {
			stream.Close()
		}
	}()

	// Subscribe to redis forwarder
	ctx, cancel := context.WithCancel(request.Context())
	updates := make(chan string)
	errors := make(chan error, 1)
	err = game.Subscribe(ctx, sess.GameID, sess.PlayerID, isGM, updates, errors)
	httpInternalErrorIf(response, request, err)
	logf(request, "Subscription task for %v established", sess.GameID)
	defer cancel()

	// Unexpire/delay expire of session
	_, err = sess.Unexpire(conn)
	httpInternalErrorIf(response, request, err)
	logf(request, "Session timer for %v %v reset", sess.Type(), sess.ID)
	defer func() {
		if _, err := sess.Expire(conn); err != nil {
			logf(request, "^^ Error resetting session: %v", err)
		} else {
			logf(request, "^^ Reset session %v for %v", sess.ID, sess.PlayerID)
		}
	}()

	// Update player online status
	_, err = game.UpdatePlayerConnections(
		sess.GameID, sess.PlayerID, player.IncreaseConnections, conn,
	)
	httpInternalErrorIf(response, request, err)
	logf(request, "Incremented online status for %v", sess.PlayerID)
	defer func() {
		if _, err := game.UpdatePlayerConnections(
			sess.GameID, sess.PlayerID, player.DecreaseConnections, conn,
		); err != nil {
			logf(request, "^^ Error decrementing player connections: %v", err)
		} else {
			logf(request, "^^ Update online %v for %v", sess.ID, sess.PlayerID)
		}
	}()

	// Log total time for response
	defer func() {
		dur := removeDecimal.ReplaceAllString(displayRequestDuration(ctx), "")
		logf(request, ">> Subscription to %v for %v closed (%v)",
			sess.GameID, sess.PlayerID, dur,
		)
	}()

	// Begin receiving events
	lastPing := time.Now()
	ssePingInterval := time.Duration(config.SSEPingSecs) * time.Second
	const pollInterval = time.Duration(2) * time.Second
	logf(request, "Begin receiving events...")
	for {
		now := time.Now()
		// End connction if stream not open
		if !stream.IsOpen() {
			logf(request, "Connection closed by remote host")
			return
		}
		// Ping stream every interval
		if now.Sub(lastPing) >= ssePingInterval {
			if err = pingStream(stream); err != nil {
				logf(request, "Unable to write to stream: %v", err)
				return
			}
			lastPing = now
		}
		select { // Receive message/error and wait out interval
		case updateText := <-updates:
			updateType := update.ParseUpdateTy(updateText)
			err := writeUpdateToStream(updateType, updateText, stream)
			if err != nil {
				logf(request, "Error writing %v to stream: %v", updateText, err)
				return
			}
			logf(request, "Sent %v update to %v", updateType, sess.PlayerID)
		case err := <-errors:
			logf(request, "<= Error from subscription task: %v", err)
			return
		case err := <-ctx.Done():
			logf(request, "<= Context was cancelled: %v", err)
			return
		case <-client.Channel:
			logf(request, "Shutdown received; closing")
			return
		case <-time.After(pollInterval):
			continue
		}
	}
}
