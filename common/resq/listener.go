package resq

import (
	"context"
	"errors"
	"fmt"

	"shadowroller.net/common/errs"

	"github.com/go-redis/redis"
)

// Listener is the equivalent of http.Server which listens on a Redis client
// for messages being posted to the queue.
type Listener struct {
	group    string
	consumer string
	client   *redis.Client
	handlers map[string]Handler
	streams  []string
}

func (l *Listener) ListenAndServe(ctx context.Context) error {
	// Check the pending queue for messages we missed
	if err := l.HandlePending(ctx); err != nil {
		return fmt.Errorf("handling pending: %w", err)
	}

	for {
		select {
		case <-ctx.Done():
			return errs.ErrHalt
		}
		readArgs := &redis.XReadGroupArgs{
			Group:    l.group,
			Consumer: l.consumer,
			Streams:  l.streams,
			Count:    1,
			NoAck:    true,
		}
		req, err := l.client.XReadGroup(ctx, readArgs)
		if errors.Is(err, context.ErrCanceled) {
			return errs.ErrHalt
		} else {
			// Retry? span?
			return err
		}
		// ..
	}
}
