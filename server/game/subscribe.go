package game

import (
	"context"
	"fmt"
	"log"

	"sr/id"
	redisUtil "sr/redis"
	"sr/update"

	"github.com/gomodule/redigo/redis"
)

type subArgs struct {
	playerID id.UID
	isGM bool
}

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
		// Check if we have received done yet
		select {
		case <-ctx.Done():
			errs <- fmt.Errorf("received done from context: %w", ctx.Err())
			return
		default:
		}
		// Receive an event or update from the game
		switch msg := sub.Receive().(type) {
		case error:
			log.Printf("Received error %#v", msg)
			errs <- fmt.Errorf("from redis Receive(): %w", msg)
			return
		case redis.Message:
			data := string(msg.Data)
			excludeID, excludeGMs, inner, found := update.ParseExclude(data)
			if found && ((excludeID == playerID) || (isGM && excludeGMs)) {
				continue
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

	channels := []string{
		GameChannel(gameID), PlayerChannel(gameID, playerID),
	}
	if isGM {
		channels = append(channels, GMsChannel(gameID))
	}

	if err := sub.Subscribe(channels); err != nil {
		cleanup()
		return fmt.Errorf("subscribing to events and history: %w", err)
	}
	go subscribeTask(ctx, cleanup, playerID, isGM, updates, errors, sub)
	return nil
}
