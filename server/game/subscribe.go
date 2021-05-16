package game

import (
	"context"
	"fmt"
	"log"

	"sr/config"
	"sr/id"
	redisUtil "sr/redis"
	"sr/update"

	"github.com/gomodule/redigo/redis"
)

// This task becomes a memory leak as we cannot signal for it to close effectively.
// The goroutine will remain open after a client disconnects, until the next event
// or update is sent in the game. The underlying connection may eventually be reclaimed by the redis pool.
// This is due to a limitation in the redigo library - we cannot check for an
// external close message while also listening on the connection without entering a reconnect loop.
// Because this leak is not indefinite, and can only grow trivally large given current traffic,
// and because I'd like to replace the library with one that can handle pipelining anyway,
// I'm going to ignore it for now and switch libraries by next major release.
func subscribeTask(ctx context.Context, cleanup func(), playerID id.UID, isGM bool, updates chan string, errs chan error, sub redis.PubSubConn) {
	defer cleanup()
	for {
		msg := sub.Receive()
		// Check if we have received done yet; no point forwarding if we have
		select {
		case <-ctx.Done():
			errs <- fmt.Errorf("received done from context: %w", ctx.Err())
			return
		default:
		}
		// Receive an event or update from the game
		switch msg.(type) {
		case error:
			log.Printf("Received error %#v", msg)
			errs <- fmt.Errorf("from redis Receive(): %w", msg)
			return
		case redis.Message:
			data := string(msg.(redis.Message).Data)
			channel := msg.(redis.Message).Channel

			excludeID, excludeGMs, inner, found := update.ParseExclude(data)
			if config.UpdatesDebug {
				if found {
					log.Printf("Exclude update on %v: !id=%v, !gms=%v",
						channel, excludeID, excludeGMs,
					)
				} else {
					log.Printf("Regular update from %v", channel)
				}
			}
			if found {
				if excludeID == playerID {
					if config.UpdatesDebug {
						log.Printf("-> skipping because player ID matched")
					}
					continue
				}
				if isGM && excludeGMs {
					if config.UpdatesDebug {
						log.Printf("-> skipping because GMs are excluded")
					}
					continue
				}
				if config.UpdatesDebug {
					log.Printf("-> No exclusion for %v", playerID)
				}
			} else if config.UpdatesDebug {
				log.Printf("-> No filter specified")
			}
			updates <- inner
		case redis.Subscription:
			// okay; ignore
		default:
			errs <- fmt.Errorf("unexpected value for Receive(): %#v", msg)
		}
	}
}

// Subscribe runs a task in a separate goroutine that will send new `Message`s to the `messages` channel
// and errors to the error channel. Both channels will be closed upon completion.
// ctx is used to cancel the remote task and must also have been initialized with a redis connection.
func Subscribe(ctx context.Context, gameID string, playerID id.UID, isGM bool, updates chan string, errors chan error) error {
	conn, err := redisUtil.ConnectWithContext(ctx)
	if err != nil {
		close(errors)
		close(updates)
		return fmt.Errorf("dialing redis with context: %w", err)
	}
	sub := redis.PubSubConn{Conn: conn}

	cleanup := func() {
		log.Print("Cleaning up subscribe task")
		if err := sub.Unsubscribe(); err != nil {
			log.Printf("Error unsubscribing: %v", err)
		}
		redisUtil.Close(conn)
		close(errors)
		close(updates)
	}

	channels := []interface{}{
		GameChannel(gameID), PlayerChannel(gameID, playerID),
	}
	if isGM {
		channels = append(channels, GMsChannel(gameID))
	}

	if err := sub.Subscribe(channels...); err != nil {
		cleanup()
		return fmt.Errorf("subscribing to events and history: %w", err)
	}
	go subscribeTask(ctx, cleanup, playerID, isGM, updates, errors, sub)
	return nil
}
