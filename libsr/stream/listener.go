package stream

import (
	"context"

	"github.com/go-redis/redis/v8"
)

type Handler func(ctx context.Context, message Message, client redis.Cmder)

type Listener struct {
	service  string
	handlers map[string]Handler
	readers  map[string]Handler
}

func NewListener(service string) *Listener {
	return *Listener{service}
}

func (l *Listener) Service() string {
	return l.service
}

func (l *Listener) HandleStream(path string, handler Handler) {
	l.handlers[path] = handler
}

func (l *Listener) ReadStream(path string, handler Handler) {
	l.readers[path] = handler
}

func (l *Listener) catchup(ctx context.Context, client redis.Cmdable) error {
	// TODO
	return nil
}

func (l *Listener) Run(ctx context.Context, client redis.Cmdable) error {
	// First, catching up.
	if err := l.catchup(ctx, client); err != nil {
		return fmt.Errorf("catching up with steam: %w", err)
	}
	args := &redis.XReadGroupArgs{
		Group: "", Consumer: "", Streams, Count, Block, NoAck: true,
	}
}
