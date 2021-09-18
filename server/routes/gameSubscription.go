package routes

import (
	"context"
	"fmt"
	"regexp"

	"sr/config"
	"sr/game"
	"sr/id"
	"sr/player"
	"sr/session"
	"sr/shutdownHandler"
	"sr/update"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/janberktold/sse"
)

func pingStream(stream *sse.Conn) error {
	return stream.WriteEvent("ping", []byte{})
}

func shouldSendUpdate(request *Request, message *redis.Message, playerID id.UID, isGM bool) (inner string, should bool) {
	excludeID, excludeGMs, inner, found := update.ParseExclude(message.Payload)
	if config.UpdatesDebug {
		if found {
			logf(request, "Exclude update on %v: !id=%v, !gms=%v",
				message.Channel, excludeID, excludeGMs,
			)
		} else {
			logf(request, "Regular update from %v", message.Channel)
		}
	}
	if found {
		if excludeID == playerID {
			if config.UpdatesDebug {
				logf(request, "-> skipping because player ID matched")
			}
			return inner, false
		}
		if isGM && excludeGMs {
			if config.UpdatesDebug {
				logf(request, "-> skipping because GMs are excluded")
			}
			return inner, false
		}
		if config.UpdatesDebug {
			logf(request, "-> No exclusion for %v", playerID)
		}
	} else if config.UpdatesDebug {
		logf(request, "-> No filter specified")
	}
	return inner, true
}

func writeUpdateToStream(updateText string, stream *sse.Conn) error {
	messageID := id.NewEventID()
	return stream.WriteEventWithID(fmt.Sprintf("%v", messageID), "upd", []byte(updateText))
}

var removeDecimal = regexp.MustCompile(`\.\d+`)

var _ = gameRouter.HandleFunc("/subscription", Wrap(handleSubscription))

func handleSubscription(response Response, request *Request, client *redis.Client) {
	sess, ctx, err := requestParamSession(request, client)
	httpUnauthorizedIf(response, request, err)
	logf(request, "Player %v to connect to %v", sess.PlayerID, sess.GameID)

	isGM, err := game.HasGM(ctx, client, sess.GameID, sess.PlayerID)
	httpInternalErrorIf(response, request, err)

	ctx, release := shutdownHandler.Register(ctx, fmt.Sprintf("request %02x subscription", requestID(ctx)))
	defer release()

	// Upgrade to SSE stream
	stream, err := sseUpgrader.Upgrade(response, request)
	httpBadRequestIf(response, request, err)
	err = pingStream(stream)
	httpBadRequestIf(response, request, err)
	if config.StreamDebug {
		logf(request, "Upgrade to SSE successful")
	}
	defer func() {
		if stream.IsOpen() {
			stream.Close()
			if config.StreamDebug {
				logf(request, "defer: closed SSE stream")
			}
		} else if config.StreamDebug {
			logf(request, "defer: SSE stream already closed")
		}
	}()

	// Subscribe to redis forwarder
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	updates, errors, cleanup := game.Subscribe(ctx, client, sess.GameID, sess.PlayerID, isGM)
	httpInternalErrorIf(response, request, err)
	defer cleanup()
	if config.StreamDebug {
		logf(request, "Subscription task for %v started", sess.GameID)
	}

	// Unexpire/delay expire of session
	_, err = session.Unexpire(ctx, client, sess)
	httpInternalErrorIf(response, request, err)
	if config.StreamDebug {
		logf(request, "Session timer for %v %v reset", sess.Type(), sess.ID)
	}
	defer func() {
		if _, err := session.Expire(ctx, client, sess); err != nil {
			logf(request, "^^ Error resetting session: %v", err)
		} else if config.StreamDebug {
			logf(request, "^^ Reset session %v for %v", sess.ID, sess.PlayerID)
		}
	}()

	// Update player online status
	_, err = game.UpdatePlayerConnections(ctx, client,
		sess.GameID, sess.PlayerID, player.IncreaseConnections,
	)
	httpInternalErrorIf(response, request, err)
	logf(request, "Incremented online status for %v", sess.PlayerID)
	defer func() {
		if _, err := game.UpdatePlayerConnections(ctx, client,
			sess.GameID, sess.PlayerID, player.DecreaseConnections,
		); err != nil {
			logf(request, "^^ Error decrementing player connections: %v", err)
		} else if config.StreamDebug {
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
	pingTicker := time.NewTicker(time.Duration(config.SSEPingSecs) * time.Second)
	defer pingTicker.Stop()
	pollTicker := time.NewTicker(time.Duration(2) * time.Second)
	defer pollTicker.Stop()
	logf(request, "Begin receiving events...")
	for {
		// End connction if stream not open
		if !stream.IsOpen() {
			logf(request, "Connection closed by remote host")
			return
		}
		select { // Receive message/error and wait out interval
		case updateMessage := <-updates:
			inner, shouldSend := shouldSendUpdate(request, updateMessage, sess.PlayerID, isGM)
			if !shouldSend {
				if config.StreamDebug {
					logf(request, "Skipping update %v to %v", update.ParseType(inner), sess.PlayerID)
				}
				continue
			}
			err := writeUpdateToStream(inner, stream)
			if err != nil {
				logf(request, "Error writing %v to stream: %v", inner, err)
				return
			} else if config.StreamDebug {
				logf(request, "Sent update %v to %v", update.ParseType(inner), sess.PlayerID)
			}
		case <-pollTicker.C:
			// Time to re-check stream.IsOpen()
			continue
		case <-pingTicker.C:
			// Ping stream every interval
			if err := pingStream(stream); err != nil {
				logf(request, "Unable to write to stream: %v", err)
				return
			} else if config.StreamDebug {
				logf(request, "Pinged stream")
			}
		case err := <-errors:
			logf(request, "<= Error from subscription task: %v", err)
			return
		case err := <-ctx.Done(): // cancelled by either the client or shutdown
			logf(request, "<= Task cancelled: %v", err)
			return
		}
	}
}
