package session

import (
	"context"
	"errors"
	"fmt"
	"sr/config"
	"sr/id"
	"sr/player"
	redisUtil "sr/redis"
	"time"

	"github.com/go-redis/redis/v8"
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
	sessionFields, err := redisUtil.StructToStringMap(sess)
	if err != nil {
		return fmt.Errorf("getting fields for session %v: %w", sess, err)
	}
	ok, err := client.HMSet(ctx, sess.redisKey(), sessionFields).Result() // TODO it expects a list, not a map?
	if err != nil || !ok {
		return fmt.Errorf("HMSET adding session %v: %w", sess, err)
	}
	_, err = Expire(ctx, client, sess)
	if err != nil {
		return fmt.Errorf("Redis error expiring session %v: %w", sess, err)
	}
	return nil
}

var errNilSession = errors.New("Nil sessionID requested")
var errNoSessionData = errors.New("Session not found")

// Exists returns whether the session exists in Redis.
func Exists(ctx context.Context, client redis.Cmdable, sessionID string) (bool, error) {
	if sessionID == "" {
		return false, errNilSession
	}
	count, err := client.Exists(ctx, "session:"+sessionID).Result()
	return count == 1, err
}

// GetByID retrieves a session from redis.
func GetByID(ctx context.Context, client redis.Cmdable, sessionID string) (*Session, error) {
	if sessionID == "" {
		return nil, errNilSession
	}
	if client == nil {
		return nil, fmt.Errorf("Client was nil!!")
	}
	var sess Session
	result := client.HGetAll(ctx, "session:"+sessionID)
	data, err := result.Result()
	if err != nil {
		return nil, fmt.Errorf("retrieving data for %v: %w", sessionID, err)
	}
	if data == nil || len(data) == 0 {
		return nil, errNoSessionData
	}
	err = result.Scan(&sess)
	if err != nil {
		return nil, fmt.Errorf("parsing session struct: %w", err)
	}
	if sess.GameID == "" || sess.PlayerID == "" {
		return nil, errNoSessionData
	}
	sess.ID = id.UID(sessionID)

	return &sess, nil
}

// Remove removes a session from Redis.
func Remove(ctx context.Context, client redis.Cmdable, sess *Session) error {
	result, err := client.Del(ctx, sess.redisKey()).Result()
	if err != nil {
		return fmt.Errorf("sending redis DEL: %w", err)
	}
	if result != 1 {
		return fmt.Errorf("expected 1 key deleted, got %v", result)
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
