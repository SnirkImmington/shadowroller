package resq

import (
	"context"
	"encoding/json"
	"time"

	"shadowroller.net/libsr"
	"shadowroller.net/libsr/errs"
	srRedis "shadowroller.net/libsr/redis"

	"go.opentelemetry.io/otel/trace"

	"github.com/go-redis/redis/v8"
)

// Headers is metadata sent with each Message.
type Headers struct {
	TraceInfo string    `redis:"trace"`
	From      string    `redis:"from"`
	Expires   time.Time `redis:"exp,omitempty"`
	After     time.Time `redis:"after,omitempty"`
}

// Message is a message sent over the queue.
type Message struct {
	Headers
	Body []byte `redis:"body,omitempty"`
}

// Parse calls json.Unmarshal with r's Body
func (r *Message) Parse(val interface{}) error {
	return json.Unmarshal([]byte(r.Body), val)
}

// ParseTraceContext attempts to parse the Message's SpanContext.
func (r *Message) ParseSpanContext() (*trace.SpanContext, error) {
	if r.TraceInfo == "" {
		return nil, errs.NotFoundf("No trace context saved")
	}
	var spanContext trace.SpanContext
	err := json.Unmarshal([]byte(r.TraceInfo), &spanContext)
	if err != nil {
		return nil, errs.Internal(err)
	}
	return &spanContext, nil
}

func NewMessage(ctx context.Context, val *interface{}) (*Message, error) {
	body, err := json.Marshal(val)
	if err != nil {
		return nil, errs.BadRequest(err)
	}
	spanCtx := trace.SpanContextFromContext(ctx)
	ctxBody, err := json.Marshal(&spanCtx)
	if err != nil {
		return nil, errs.Internalf("unable to marshal span context: %w", err)
	}
	headers := Headers{
		TraceInfo: string(ctxBody),
		From:      libsr.ServiceName,
		Expires:   time.Time{},
		After:     time.Time{},
	}
	return &Message{
		Headers: headers,
		Body:    body,
	}, nil
}

func SendMessage(ctx context.Context, client redis.Cmdable, stream string, msg *Message) (string, error) {
	msgMap, err := srRedis.StructToStringMap(msg)
	if err != nil {
		return "", errs.BadRequest(err)
	}
	args := redis.XAddArgs{
		Stream:     stream,
		NoMkStream: false,
		MaxLen:     1024,
		Approx:     true,
		Values:     msgMap,
	}
	return client.XAdd(ctx, &args).Result()
}

func SendReply(ctx context.Context, client redis.Cmdable, id string, reply *Reply) error {
	bytes, err := json.Marshal(reply)
	if err != nil {
		return errs.BadRequest(err)
	}
	return client.LPush(ctx, "reply:"+id, bytes).Err()
}

func ReceiveReply(ctx context.Context, client redis.Cmdable, id string) (*Reply, error) {
	// blpop returns key, value
	popped, err := client.BLPop(ctx, time.Duration(4)*time.Second, id).Result()
	if err != nil {

	}
	if len(popped) != 2 {
		return nil, errs.Internalf("expected 2 results from redis, got %v", popped)
	}
	var reply *Reply
	err = json.Unmarshal([]byte(popped[1]), reply)
	if err != nil {
		return nil, err
	}
	return reply, nil
}

func ReceiveFirstReply(ctx context.Context, client redis.Cmdable, id string) (string, *Reply, error) {
	popped, err := client.BLPop(ctx, time.Duration(4)*time.Second, id).Result()
	if len(popped) != 2 {
		return "", nil, errs.Internalf("expected 2 results from redis, got %v", popped)
	}
}

func removeValueStrings(strings []string, value string) []string {
	if len(strings) == 0 {
		return strings
	}
	if len(strings) == 1 {
		if value == strings[0] {
			return []string{}
		} else {
			return strings
		}
	}
	for ix, val := range strings {
		if val != value {
			continue
		}
		if ix == 0 {
			return strings[1:]
		}
		if ix == len(strings)-1 {
			return strings[:ix]
		}
		return append(strings[0:ix-1], strings[ix:]...)
	}
	return strings
}

// RecieveAllReplies listens for replies on all given IDs, and returns oll of the replies.
func RecieveAllReplies(ctx context.Context, client redis.Cmdable, ids []string) (map[string]*Reply, error) {
	dur := time.Duration(4) * time.Second
	var res map[string]*Reply

	for i := 0; i < len(ids); i++ {
		iterStart := time.Now()
		popped, err := client.BLPop(ctx, dur, ids...).Result()
		if err != nil {
			return nil, errs.Internalf("redis error on round %v: %w", i+1, err)
		}
		if len(popped) != 2 {
			return nil, errs.Internalf("round %v: expected 2 results, got %v", i+1, popped)
		}
		var reply *Reply
		err = json.Unmarshal([]byte(popped[1]), reply)
		if err != nil {
			return nil, errs.Internalf("json parse on round %v: %w", i+1, err)
		}
		res[popped[0]] = reply
		dur = dur - time.Now().Sub(iterStart)
		if dur <= 0 {
			return res, errs.Internalf("request timed out")
		}
		ids = removeValueStrings(ids, popped[0])
	}
	return res, nil
}
