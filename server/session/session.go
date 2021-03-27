package session

import (
	"errors"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"sr/config"
	"sr/id"
	"sr/player"
	"time"
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

// New makes a new session for the given player.
// MakeSession adds a session for the given player in the given game
func New(gameID string, player *player.Player, persist bool, conn redis.Conn) (*Session, error) {
	sessionID := id.GenSessionID()
	session := Session{
		ID:       sessionID,
		GameID:   gameID,
		PlayerID: player.ID,
		Username: player.Username,
		Persist:  persist,
	}

	sessionArgs := redis.Args{}.Add(session.redisKey()).AddFlat(&session)
	_, err := redis.String(conn.Do("hmset", sessionArgs...))
	if err != nil {
		return nil, fmt.Errorf("Redis error adding session %v: %w", sessionID, err)
	}
	_, err = session.Expire(conn)
	if err != nil {
		return nil, fmt.Errorf("Redis error expiring session %v: %w", sessionID, err)
	}
	return &session, nil
}

var errNilSession = errors.New("Nil sessionID requested")
var errNoSessionData = errors.New("Session not found")

// Exists returns whether the session exists in Redis.
func Exists(sessionID string, conn redis.Conn) (bool, error) {
	if sessionID == "" {
		return false, errNilSession
	}
	return redis.Bool(conn.Do("exists", "session:"+sessionID))
}

// GetByID retrieves a session from redis.
func GetByID(sessionID string, conn redis.Conn) (*Session, error) {
	if sessionID == "" {
		return nil, errNilSession
	}
	var session Session
	data, err := conn.Do("hgetall", "session:"+sessionID)
	if err != nil {
		return nil, fmt.Errorf("Redis error retrieving data for %v: %w", sessionID, err)
	}
	if data == nil || len(data.([]interface{})) == 0 {
		return nil, errNoSessionData
	}
	err = redis.ScanStruct(data.([]interface{}), &session)
	if err != nil {
		return nil, fmt.Errorf("Error parsing session struct: %w", err)
	}
	if session.GameID == "" || session.PlayerID == "" {
		return nil, errNoSessionData
	}
	session.ID = id.UID(sessionID)

	return &session, nil
}

// GetPlayer retrieves the full player info for a given session
func (s *Session) GetPlayer(conn redis.Conn) (*player.Player, error) {
	return player.GetByID(string(s.PlayerID), conn)
}

// Remove removes a session from Redis.
func (s *Session) Remove(conn redis.Conn) error {
	result, err := redis.Int(conn.Do("DEL", s.redisKey()))
	if err != nil {
		return fmt.Errorf("sending redis DEL: %w", err)
	}
	if result != 1 {
		return fmt.Errorf("expected 1 key deleted, got %v", result)
	}
	return nil
}

// Expire sets the session to expire in `config.SesssionExpirySecs`.
func (s *Session) Expire(conn redis.Conn) (bool, error) {
	ttl := config.TempSessionTTLSecs
	if s.Persist {
		ttl = int(time.Duration(config.PersistSessionTTLDays*24) * time.Hour)
	}
	return redis.Bool(conn.Do(
		"expire", s.redisKey(), ttl,
	))
}

// Unexpire prevents the session from exipiring.
func (s *Session) Unexpire(conn redis.Conn) (bool, error) {
	return redis.Bool(conn.Do("persist", s.redisKey()))
}
