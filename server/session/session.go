package session

import (
	"context"
	"fmt"
	"time"

	"sr/config"
	"sr/errs"
	"sr/id"
	srOtel "sr/otel"
	"sr/player"
	redisUtil "sr/redis"

	"github.com/go-redis/redis/v8"
	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

// Session is a temporary or persistent authentication token for users.
// Sessions are checked by redis for each authenticated endpoint hit.
//
// Sessions are used in order to track authenticated requests over
// remote calls by passing their IDs.
//
// Temporary sessions are set to expire with a short TTL when the user is not
// reading from a game subscription.
//
// Persistent sessions are set to expire with a longer-term TTL.
type Session struct {
	ID       id.UID `redis:"-"`
	GameID   string `redis:"gameID"`
	PlayerID id.UID `redis:"playerID"`
	Persist  bool   `redis:"persist"`
	Username string `redis:"username"`
}

// Type returns "persist" for persistent sessions and "temp" for temp sessions.
func (s *Session) Type() string {
	if s.Persist {
		return "persist"
	}
	return "temp"
}

// PlayerInfo formats the session's player and game info for use in logging.
func (s *Session) PlayerInfo() string {
	return fmt.Sprintf(
		"%v (%v) in %v",
		s.PlayerID, s.Username, s.GameID,
	)
}

func (s *Session) String() string {
	return fmt.Sprintf(
		"%v (%s %v in %v)",
		s.ID, s.Type(), s.PlayerID, s.GameID,
	)
}

func (s *Session) redisKey() string {
	if s == nil || s.ID == "" {
		panic("Attempted to call redisKey() on nil session")
	}
	return "session:" + string(s.ID)
}

// New constructs a new session.
func New(plr *player.Player, gameID string, persist bool) *Session {
	sessionID := id.GenSessionID()
	return &Session{
		ID:       sessionID,
		GameID:   gameID,
		PlayerID: plr.ID,
		Username: plr.Username,
		Persist:  persist,
	}
}

// New makes a new session for the given player.
// MakeSession adds a session for the given player in the given game
func Create(ctx context.Context, client redis.Cmdable, sess *Session) error {
	ctx, span := srOtel.Tracer.Start(ctx, "session.Create")
	defer span.End()
	sessionFields, err := redisUtil.StructToStringMap(sess)
	if err != nil {
		return srOtel.WithSetErrorf(span, "getting fields for session %v: %w", sess, err)
	}
	ok, err := client.HMSet(ctx, sess.redisKey(), sessionFields).Result() // TODO it expects a list, not a map?
	if err != nil || !ok {
		return srOtel.WithSetErrorf(span, "HMSET adding session %v: %w", sess, err)
	}
	_, err = Expire(ctx, client, sess)
	if err != nil {
		return srOtel.WithSetErrorf(span, "Redis error expiring session %v: %w", sess, err)
	}
	return nil
}

var errNilSession = errs.BadRequestf("nil SessionID requested")
var errNoSessionData = errs.NotFoundf("session not found")

// Exists returns whether the session exists in Redis.
func Exists(ctx context.Context, client redis.Cmdable, sessionID string) (bool, error) {
	if sessionID == "" {
		return false, errNilSession
	}
	count, err := client.Exists(ctx, "session:"+sessionID).Result()
	return count == 1, errs.Internal(err)
}

// GetByID retrieves a session from redis.
//
// Returns [errs.]
func GetByID(ctx context.Context, client redis.Cmdable, sessionID string) (*Session, error) {
	ctx, span := srOtel.Tracer.Start(ctx, "session.GetByID", trace.WithAttributes(
		attr.String("sr.sessionID", sessionID),
	))
	defer span.End()

	if sessionID == "" {
		span.AddEvent("Empty session ID provided")
		return nil, errNilSession
	}

	result := client.HGetAll(ctx, "session:"+sessionID)
	data, err := result.Result()
	if err != nil {
		err = errs.Internalf("retrieving session %v: %w", sessionID, err)
		return nil, srOtel.WithSetError(span, err)
	}
	if len(data) == 0 {
		span.AddEvent("Session not found")
		return nil, errNoSessionData
	}

	var sess Session
	err = result.Scan(&sess)
	if err != nil {
		err = errs.Internalf("parsing sesion %v: %w", sessionID, err)
		return nil, srOtel.WithSetError(span, err)
	}
	if sess.GameID == "" || sess.PlayerID == "" {
		span.AddEvent("Empty session found, removing")
		_, err = client.Del(ctx, "session:"+sessionID).Result()
		if err != nil {
			err = errs.Internalf("nonfatal error removing empty session: %w", err)
			// Record this error but don't mark span as failed
			span.RecordError(err)
		}
		return nil, errNoSessionData
	}
	sess.ID = id.UID(sessionID)

	return &sess, nil
}

// Remove removes a session from Redis.
func Remove(ctx context.Context, client redis.Cmdable, sess *Session) error {
	ctx, span := srOtel.Tracer.Start(ctx, "session.Remove")
	defer span.End()

	result, err := client.Del(ctx, sess.redisKey()).Result()

	if err != nil {
		err = errs.Internalf("deleting session %v: %w", sess.ID, err)
		return srOtel.WithSetError(span, err)
	}

	if result != 1 {
		err = errs.Internalf("deleting session %v: %v keys deleted", sess.ID, result)
		return srOtel.WithSetError(span, err)
	}
	return nil
}

// Expire sets the session to expire in `config.SesssionExpirySecs`.
func Expire(ctx context.Context, client redis.Cmdable, sess *Session) (bool, error) {
	var ttl time.Duration
	if sess.Persist {
		ttl = time.Duration(config.PersistSessionTTLDays*24) * time.Hour
	} else {
		ttl = time.Duration(config.TempSessionTTLSecs) * time.Second
	}
	return client.Expire(ctx, sess.redisKey(), ttl).Result()
}

// Unexpire prevents the session from exipiring.
func Unexpire(ctx context.Context, client redis.Cmdable, sess *Session) (bool, error) {
	return client.Persist(ctx, sess.redisKey()).Result()
}
