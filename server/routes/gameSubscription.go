package routes

import (
	"context"
	"fmt"
	"regexp"
	"time"

	"sr/config"
	"sr/errs"
	"sr/game"
	srHTTP "sr/http"
	"sr/id"
	"sr/log"
	"sr/player"
	"sr/session"
	"sr/shutdown"
	"sr/taskCtx"
	"sr/update"

	"github.com/go-redis/redis/v8"
	"github.com/janberktold/sse"
)

func pingStream(stream *sse.Conn) error {
	return stream.WriteEvent("ping", []byte{})
}

func shouldSendUpdate(ctx context.Context, message *redis.Message, playerID id.UID, isGM bool) (inner string, should bool) {
	excludeID, excludeGMs, inner, found := update.ParseExclude(message.Payload)
	if config.UpdatesDebug {
		if found {
			log.Printf(ctx, "Exclude update on %v: !id=%v, !gms=%v",
				message.Channel, excludeID, excludeGMs,
			)
		} else {
			log.Printf(ctx, "Regular update from %v", message.Channel)
		}
	}
	if found {
		if excludeID == playerID {
			if config.UpdatesDebug {
				log.Printf(ctx, "-> skipping because player ID matched")
			}
			return inner, false
		}
		if isGM && excludeGMs {
			if config.UpdatesDebug {
				log.Printf(ctx, "-> skipping because GMs are excluded")
			}
			return inner, false
		}
		if config.UpdatesDebug {
			log.Printf(ctx, "-> No exclusion for %v", playerID)
		}
	} else if config.UpdatesDebug {
		log.Printf(ctx, "-> No filter specified")
	}
	return inner, true
}

func writeUpdateToStream(updateText string, stream *sse.Conn) error {
	messageID := id.NewEventID()
	return stream.WriteEventWithID(fmt.Sprintf("%v", messageID), "upd", []byte(updateText))
}

var removeDecimal = regexp.MustCompile(`\.\d+`)

var _ = srHTTP.Handle(gameRouter, "GET /subscription", handleSubscription)

func handleSubscription(args *srHTTP.Args) {
	requestCtx, response, request, client, _ := args.Get()
	sess, err := srHTTP.RequestParamSession(request, client)
	srHTTP.Halt(requestCtx, errs.NoAccess(err))

	log.Printf(requestCtx, "Player %v to connect to %v", sess.PlayerID, sess.GameID)

	isGM, err := game.HasGM(requestCtx, client, sess.GameID, sess.PlayerID)
	srHTTP.HaltInternal(requestCtx, err)

	taskName := fmt.Sprintf("request %v SSE", taskCtx.GetName(requestCtx))
	shutdownCtx, release := shutdown.Register(context.Background(), taskName)
	defer release()

	// This will prevent bytes read and written from being reported to the SSE
	// library. However, the SSE library won't work with our wrapped library,
	// and also depends on arbitrary casts:
	// - Flusher, which Go didn't add to ResponseWriter
	// - CloseNotifier, which is now deprecated in favor of using the Request's
	// context.
	// When we upgrade to WebSockets, we'll address this gap.
	if inner, ok := response.(srHTTP.WrappedResponse); ok {
		response = inner.Inner()
	}

	// Upgrade to SSE stream
	stream, err := sseUpgrader.Upgrade(response, request)
	srHTTP.Halt(requestCtx, errs.BadRequest(err))
	if config.StreamDebug {
		log.Printf(requestCtx, "Initial stream ping...")
	}
	err = pingStream(stream)
	srHTTP.Halt(requestCtx, errs.BadRequest(err))
	if config.StreamDebug {
		log.Printf(requestCtx, "Upgrade to SSE successful")
	}
	defer func() {
		if stream.IsOpen() {
			stream.Close()
			if config.StreamDebug {
				log.Printf(shutdownCtx, "^^ closed SSE stream")
			}
		} else if config.StreamDebug {
			log.Printf(shutdownCtx, "^^ SSE stream already closed")
		}
	}()

	// Subscribe to redis forwarder
	cancelCtx, cancel := context.WithCancel(shutdownCtx)
	defer cancel()
	updates, errors, cleanup := game.Subscribe(requestCtx, client, sess.GameID, sess.PlayerID, isGM)
	srHTTP.HaltInternal(requestCtx, err)
	defer cleanup()
	if config.StreamDebug {
		log.Printf(requestCtx, "Subscription task for %v started", sess.GameID)
	}

	// Unexpire/delay expire of session
	_, err = session.Unexpire(requestCtx, client, sess)
	srHTTP.HaltInternal(requestCtx, err)
	if config.StreamDebug {
		log.Printf(requestCtx, "Session timer for %v %v reset", sess.Type(), sess.ID)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), time.Duration(5)*time.Second)
		defer cancel()
		if _, err := session.Expire(ctx, client, sess); err != nil {
			log.Printf(ctx, "^^ Error resetting session: %v", err)
		} else if config.StreamDebug {
			log.Printf(ctx, "^^ Reset session %v for %v", sess.ID, sess.PlayerID)
		}
	}()

	// Update player online status
	_, err = game.UpdatePlayerConnections(requestCtx, client,
		sess.GameID, sess.PlayerID, player.IncreaseConnections,
	)
	srHTTP.HaltInternal(requestCtx, err)
	if config.StreamDebug {
		log.Printf(requestCtx, "Incremented online status for %v", sess.PlayerID)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), time.Duration(5)*time.Second)
		defer cancel()
		if _, err := game.UpdatePlayerConnections(ctx, client,
			sess.GameID, sess.PlayerID, player.DecreaseConnections,
		); err != nil {
			log.Printf(ctx, "^^ Error decrementing player connections: %v", err)
		} else if config.StreamDebug {
			log.Printf(ctx, "^^ Update online %v for %v", sess.ID, sess.PlayerID)
		}
	}()

	// Log total time for response
	defer func() {
		dur := taskCtx.FormatDuration(requestCtx)
		dur = removeDecimal.ReplaceAllString(dur, "")
		log.Printf(requestCtx, ">> Subscription to %v for %v closed (%v)",
			sess.GameID, sess.PlayerID, dur,
		)
	}()

	// Begin receiving events
	pingTicker := time.NewTicker(time.Duration(config.SSEPingSecs) * time.Second)
	defer pingTicker.Stop()
	pollTicker := time.NewTicker(time.Duration(2) * time.Second)
	defer pollTicker.Stop()

	log.Event(requestCtx, "Game subscription started")
	defer log.Event(requestCtx, "Game subscription ended")

	for {
		// End connction if stream not open
		if !stream.IsOpen() {
			log.Printf(requestCtx, "Connection closed by remote host")
			return
		}
		select { // Receive message/error and wait out interval
		case updateMessage := <-updates:
			inner, shouldSend := shouldSendUpdate(requestCtx, updateMessage, sess.PlayerID, isGM)
			if !shouldSend {
				if config.StreamDebug {
					log.Printf(requestCtx, "Skipping update %v to %v", update.ParseType(inner), sess.PlayerID)
				}
				continue
			}
			err := writeUpdateToStream(inner, stream)
			if err != nil {
				log.Printf(requestCtx, "Error writing %v to stream: %v", inner, err)
				return
			} else if config.StreamDebug {
				log.Printf(requestCtx, "Sent update %v to %v", update.ParseType(inner), sess.PlayerID)
			}
		case <-pollTicker.C:
			// Time to re-check stream.IsOpen()
			continue
		case <-pingTicker.C:
			// Ping stream every interval
			if err := pingStream(stream); err != nil {
				log.Printf(requestCtx, "Unable to write to stream: %v", err)
				return
			} else if config.StreamDebug {
				log.Printf(requestCtx, "Pinged stream")
			}
		case err := <-errors:
			log.Printf(requestCtx, "<= Error from subscription task: %v", err)
			return
		case err := <-cancelCtx.Done():
			log.Printf(requestCtx, "<= Request cancelled: %v", err)
			return
		case err := <-shutdownCtx.Done():
			log.Printf(requestCtx, "<= Cancellation due to shutdown: %v", err)
			return
		}
	}
}
