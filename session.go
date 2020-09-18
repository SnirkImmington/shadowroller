package sr

import (
	"errors"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"sr/config"
	"time"
)

// Session is a temporary or persistent authentication token for users.
//
// Sessions are used in order to track authenticated requests over
// remote calls by passing their IDs.
//
// Sessions are checked by redis for each authenticated endpoint hit.
// In addition to IDs of the auth'd player and game, sessions contain
// commonly-used data, such as the player name, in order to reduce the
// number of database requests handlers make. This data must be kept up to
// date in the session if it is modified elsewhere.
//
// Temporary sessions are set to expire with a short TTL when the user is not
// reading from a game subscription.
//
// Persistent sessions are set to expire with a longer-term TTL.
type Session struct {
	// Immutable fields: make a new Session
	ID       UID    `redis:"-"`
	GameID   string `redis:"gameID"`
	PlayerID UID    `redis:"playerID"`
	Persist  bool   `redis:"persist"`
	// Mutable fields: keep the session up to date with the game/player
	PlayerName string `redis:"playerName"`
}

// Type returns "persist" for persistent sessions and "temp" for temp sessions.
func (s *Session) Type() string {
	if s.Persist {
		return "persist"
	}
	return "temp"
}

// LogInfo formats the session's player and game info for use in logging.
func (s *Session) LogInfo() string {
	return fmt.Sprintf(
		"%v (%v) in %v",
		s.PlayerName, s.PlayerID, s.GameID,
	)
}

// PlayerInfo formats the less-technical player info for use in logging.
func (s *Session) PlayerInfo() string {
	return fmt.Sprintf(
		"%v (%v in %v)",
		s.PlayerID, s.PlayerName, s.GameID,
	)
}

// SessionInfo formats the session's ID fields for use in logging.
func (s *Session) SessionInfo() string {
	return fmt.Sprintf(
		"%v (%s %v in %v)",
		s.ID, s.Type(), s.PlayerID, s.GameID,
	)
}

func (s *Session) String() string {
	return fmt.Sprintf(
		"%v (%v) in %v (%v %v)",
		s.PlayerName, s.PlayerID, s.GameID, s.Type(), s.ID,
	)
}

func (s *Session) redisKey() string {
	if s == nil || s.ID == "" {
		panic("Attempted to call redisKey() on nil session")
	}
	return "session:" + string(s.ID)
}

// NewPlayerSession makes a new session for the given player name.
func NewPlayerSession(gameID string, playerName string, persist bool, conn redis.Conn) (Session, error) {
	playerID := GenUID()
	return MakeSession(gameID, playerName, playerID, persist, conn)
}

// MakeSession adds a session for the given player in the given game
func MakeSession(gameID string, playerName string, playerID UID, persist bool, conn redis.Conn) (Session, error) {
	sessionID := GenSessionID()
	session := Session{
		ID:       sessionID,
		GameID:   gameID,
		PlayerID: playerID,
		Persist:  persist,

		PlayerName: playerName,
	}

	sessionArgs := redis.Args{}.Add(session.redisKey()).AddFlat(&session)
	_, err := redis.String(conn.Do("hmset", sessionArgs...))
	if err != nil {
		return Session{}, fmt.Errorf("Redis error adding session %v: %w", sessionID, err)
	}
	_, err = ExpireSession(&session, conn)
	if err != nil {
		return Session{}, fmt.Errorf("Redis error expiring session %v: %w", sessionID, err)
	}
	return session, nil
}

var errNilSession = errors.New("Nil sessionID requested")
var errNoSessionData = errors.New("Session not found")

// SessionExists returns whether the session exists in Redis.
func SessionExists(sessionID string, conn redis.Conn) (bool, error) {
	if sessionID == "" {
		return false, errNilSession
	}
	return redis.Bool(conn.Do("exists", "session:"+sessionID))
}

// GetSessionByID retrieves a session from redis.
func GetSessionByID(sessionID string, conn redis.Conn) (Session, error) {
	if sessionID == "" {
		return Session{}, errNilSession
	}
	var session Session
	data, err := conn.Do("hgetall", "session:"+sessionID)
	if err != nil {
		return Session{}, fmt.Errorf("Redis error retrieving data for %v: %w", sessionID, err)
	}
	if data == nil || len(data.([]interface{})) == 0 {
		return Session{}, errNoSessionData
	}
	err = redis.ScanStruct(data.([]interface{}), &session)
	if err != nil {
		return Session{}, fmt.Errorf("Error parsing session struct: %w", err)
	}
	if session.GameID == "" || session.PlayerID == "" {
		return Session{}, errNoSessionData
	}
	session.ID = UID(sessionID)

	return session, nil
}

// RemoveSession removes a session from Redis.
func RemoveSession(session *Session, conn redis.Conn) error {
	err := conn.Send("MULTI")
	if err != nil {
		return fmt.Errorf("Redis error queuing MULTI: %w", err)
	}
	err = conn.Send("DEL", session.redisKey())
	if err != nil {
		return fmt.Errorf("Redis error queuing DEL: %w", err)
	}
	err = conn.Send("HDEL", "player:"+session.GameID, session.PlayerID)
	if err != nil {
		return fmt.Errorf("Redis error queuing HDEL: %w", err)
	}
	results, err := redis.Ints(conn.Do("EXEC"))
	if err != nil {
		return fmt.Errorf("Redis error EXECing: %w", err)
	}
	if len(results) == 2 && results[0] == 1 && results[1] == 1 {
		return nil
	}
	return fmt.Errorf("Unexpected response from redis: %w", results)
}

// ExpireSession sets the session to expire in `config.SesssionExpirySecs`.
func ExpireSession(session *Session, conn redis.Conn) (bool, error) {
	ttl := config.TempSessionTTLSecs
	if session.Persist {
		ttl = int(time.Duration(config.PersistSessionTTLDays*24) * time.Hour)
	}
	return redis.Bool(conn.Do(
		"expire", session.redisKey(), ttl,
	))
}

// UnexpireSession prevents the session from exipiring.
func UnexpireSession(session *Session, conn redis.Conn) (bool, error) {
	return redis.Bool(conn.Do("persist", session.redisKey()))
}
