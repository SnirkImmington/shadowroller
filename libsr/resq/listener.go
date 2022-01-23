package resq

import (
	"context"
	"errors"
	"fmt"
	"time"

	"shadowroller.net/libsr/errs"
	"shadowroller.net/libsr/log"
	srOtel "shadowroller.net/libsr/otel"
	"shadowroller.net/libsr/shutdown"

	"go.opentelemetry.io/otel/trace"

	"github.com/go-redis/redis/v8"
)

// Handler is the interface of functions to handle stream messages.
type Handler interface {
	HandleMessage(args *Args)
}

// HandlerFunc is a function which can handle a stream message.
type HandlerFunc func(args *Args)

var _ Handler = (HandlerFunc)(nil)

func (h HandlerFunc) HandleMessage(args *Args) {
	h(args)
}

// Args are arguments passed to a Handler.
type Args struct {
	Ctx     context.Context
	Message *Message
	Client  *redis.Client
}

// Get retrieves the fields of the Args
func (args *Args) Get() (context.Context, *Message, *redis.Client) {
	return args.Ctx, args.Message, args.Client
}

// Listener is the equivalent of http.Server which listens on a Redis client
// for messages being posted to the queue.
type Listener struct {
	now      func() time.Time
	group    string        // stream group
	consumer string        // stream consumer
	client   *redis.Client // redis client
	handlers map[string]Handler
	streams  []string
	lastID   map[string]string // last ID seen for each stream
}

// NewListener creates a new listener using the given client for the given group
// and consumer. Each service should have one or more consumer groups, and should
// have at least two "standard" listeners to account for basic concurrency.
func NewListener(client *redis.Client, group string, consumer string) *Listener {
	return &Listener{}
}

// SetTimeFunc sets the time func for the listener.
func (l *Listener) SetTimeFunc(now func() time.Time) {
	l.now = now
}

func (l *Listener) Name() string {
	return fmt.Sprintf("%v:%v", l.consumer, l.group)
}

// HandleFunc registers the given HandlerFunc for the listener.
func (l *Listener) HandleFunc(stream string, handler func(args *Args)) {
	l.Handle(stream, HandlerFunc(handler))
}

// Handle registers the given Handler for the listener.
func (l *Listener) Handle(stream string, handler Handler) {
	if _, found := l.handlers[stream]; found {
		panic(fmt.Sprintf("Attempted to double-register handler for %v", stream))
	}
	l.handlers[stream] = handler
	l.streams = append(l.streams, stream)
	l.lastID[stream] = "0-0" // Not sure if we need to track this given xclaim
}

func (l *Listener) runHandler(ctx context.Context, handler Handler, path string, id string, rawMessage map[string]interface{}) {
	var message *Message
	//err := redisUtil.Parse(rawMessage, &request)
	// if err !+ nil {
	// // We need a way to forward this parse error here.
	// }

	// Get the span info from the request
	var link trace.Link
	spanContext, err := message.ParseSpanContext()
	if err == nil {
		link = trace.Link{
			SpanContext: *spanContext,
			// Attributes
		}
	} else if !errors.Is(err, errs.ErrNotFound) {
		// This is the parse error
	}
	// Start a child span for the process
	opts := []trace.SpanStartOption{
		trace.WithSpanKind(trace.SpanKindConsumer),
	}
	if err == nil { // if link was set
		opts = append(opts, trace.WithLinks(link))
	}
	name := fmt.Sprintf("handle %v %v", path, id) // Not sure what to put here
	ctx, span := srOtel.Tracer.Start(ctx, name, opts...)
	defer span.End()

	if !message.Expires.IsZero() {
		span.AddEvent("Apply timeout")
		if time.Now().After(message.Expires) {
			span.AddEvent("Message is expired")
			return
		}
		ctx, _ = context.WithDeadline(ctx, message.Expires)
		// Maybe do an initial check of the timeout here
	}
	if !message.After.IsZero() {
		_, subSpan := srOtel.Tracer.Start(ctx, "sleep till request After")
		time.Sleep(time.Until(message.After))
		subSpan.End()
	}

	// We don't hold up the shutdown context in the handler, the handler can check
	// the shutdown status itself if it wants to.
	_, release := shutdown.Register(ctx, name)
	defer release()

	// handle defer
	defer func() {
		var data interface{}
		if data = recover(); data == nil {
			return
		}

		var err error
		if passedErr, ok := data.(error); ok {
			err = passedErr
		} else {
			err = fmt.Errorf("%w: unexpected panic data %v", errs.ErrLogic, data)
		}

		if errors.Is(err, errs.ErrHalt) {
			return
		}

		if !errors.Is(err, errs.ErrHalt) {
			span.RecordError(err)
			srOtel.WithSetError(span, err, trace.WithStackTrace(true))
		}
		// If the error is a redis error, we may not be able to reply and stuff
	}()

	handler.HandleMessage(&Args{ctx, message, l.client})
}

// Autoclaim runs XAutoclaim for the given stream and calls the handler for that
// stream on the results. Autoclaim attempts to run handlers for each message
// received, in order, and returns any errors encountered, indexed by stream ID.
// Returns BadRequest if the listener does not handle the stream, or Internal if
// there is a redis error performing the XAutoclaim.
func (l *Listener) Autoclaim(ctx context.Context, stream string, start string, minIdle time.Duration) (map[string]error, error) {
	handler, found := l.handlers[stream]
	if !found {
		return nil, errs.BadRequestf("listener does not handle stream %v", stream)
	}
	var result map[string]error
	round := 1
	for /* Until the queue is empty */ {
		claimArgs := redis.XAutoClaimArgs{
			Stream:   stream,
			Group:    l.group,
			Consumer: l.consumer,
			Start:    start,
			MinIdle:  minIdle,
		}
		messages, newStart, err := l.client.XAutoClaim(ctx, &claimArgs).Result()
		if err != nil {
			return result, errs.Internalf("on round %v: %w", round, err)
		}
		log.Printf(ctx, "autoclaim: round %v, got %v messages", round, len(messages))
		for _, msg := range messages {
			log.Printf(ctx, "handle %v", msg.ID)
			// Can't call runHandler here:
			// - no way to determine if handler worked or not
			// -
			l.runHandler(ctx, handler, stream, msg.ID, msg.Values)
		}
		if newStart == "0-0" {
			break // All messages consumed
		}
		start = newStart
		round++
	}
	return result, nil
}

func (l *Listener) handlePendingOld(ctx context.Context) error {
	ctx, span := srOtel.Tracer.Start(ctx, l.Name()+" handlePending")
	defer span.End()
	// May want to loop this entire section.
	claimIDs := make(map[string]string, len(l.handlers))
	handled := 0
	round := 1
	var results map[string]*redis.XAutoClaimCmd
	for handled < len(l.streams) {
		log.Printf(ctx, "round %v, handled %v", round, handled)
		_, err := l.client.Pipelined(ctx, func(pipe redis.Pipeliner) error {
			for _, stream := range l.streams {
				start, found := claimIDs[stream]
				if !found {
					start = "0-0"
				} else if start == "claimed" {
					continue
				}
				args := redis.XAutoClaimArgs{
					Stream:   stream,
					Group:    l.group,
					Consumer: l.consumer,
					Start:    start,
					// Not sure what this should be if we're trying to continue processing
					MinIdle: time.Duration(4) * time.Second,
				}
				result := l.client.XAutoClaim(ctx, &args)
				results[stream] = result
			}
			return nil
		})
		if err != nil {
			return errs.Internalf("round %v: claim pipeline: %w", err)
		}
		for ix, result := range results {

		}
	}
	return nil
}

// ListenAndServe starts running each of the listener's clients. It first uses
// XAUTOCLAIM to catch up with unexpired
func (l *Listener) ListenAndServe(ctx context.Context) error {
	// Check the pending queue for messages we missed
	if err := l.handlePending(ctx); err != nil {
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
			Block:    time.Duration(4) * time.Second,
			NoAck:    true,
		}
		entries, err := l.client.XReadGroup(ctx, readArgs).Result()
		if errors.Is(err, context.Canceled) {
			return errs.ErrHalt
		} else {
			// Retry? span?
			return err
		}
		// ..
	}
}
