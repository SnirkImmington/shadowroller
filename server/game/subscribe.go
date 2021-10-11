package game

import (
	"context"
	"fmt"
	"time"

	"sr/config"
	"sr/id"
	"sr/log"
	srOtel "sr/otel"

	"github.com/go-redis/redis/v8"
)

// Subscribe runs a task in a separate goroutine that will send new `Message`s to the `messages` channel
// and errors to the error channel. Both channels will be closed upon completion.
// ctx is used to cancel the remote task and must also have been initialized with a redis connection.
// As noted in redis client.Subscribe(), the subscription is not immediately active.
func Subscribe(ctx context.Context, client *redis.Client, gameID string, playerID id.UID, isGM bool) (<-chan *redis.Message, <-chan error, func()) {
	ctx, span := srOtel.Tracer.Start(ctx, "game.Subscribe")
	defer span.End()
	channels := []string{
		GameChannel(gameID), PlayerChannel(gameID, playerID),
	}
	if isGM {
		channels = append(channels, GMsChannel(gameID))
	}

	sub := client.Subscribe(ctx, channels...)
	updates := sub.Channel(
		redis.WithChannelHealthCheckInterval(time.Duration(config.RedisHealthcheckSecs) * time.Second),
	)
	errors := make(chan error)
	cleanup := func() {
		if config.StreamDebug {
			log.Print(ctx, "Cleaning up subscribe task")
		}
		ctx, cancel := context.WithTimeout(context.Background(), time.Duration(5)*time.Second)
		defer cancel()
		if err := sub.Unsubscribe(ctx); err != nil {
			errors <- fmt.Errorf("unsubscribing: %w", err)
			log.Printf(ctx, "Error unsubscribing %v from %v: %v", playerID, gameID, err)
		}
		if err := sub.Close(); err != nil {
			errors <- fmt.Errorf("closing subscription: %w", err)
			log.Printf(ctx, "Error closing redis subscription for %v in %v: %v", playerID, gameID, err)
		}

		close(errors)
		// updates is closed by redis library
	}
	return updates, errors, cleanup
}
