package sr

import (
	"errors"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"log"
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
	ID       UID    `redis:"-"`
	GameID   string `redis:"gameID"`
	PlayerID UID    `redis:"playerID"`
	Persist  bool   `redis:"persist"`

	PlayerName string `redis:"playerName"`
}

func (s *Session) Type() string {
	if s.Persist {
		return "persist"
	} else {
		return "temp"
	}
}

func (s *Session) LogInfo() string {
	return fmt.Sprintf(
		"%v (%v) in %v",
		s.PlayerName, s.PlayerID, s.GameID,
	)
}

func (s *Session) String() string {
	return fmt.Sprintf(
		"%v (%v) in %v (%s %v)",
		s.PlayerName, s.PlayerID, s.GameID, s.ID, s.Type(),
	)
}

func (s *Session) redisKey() string {
	if s == nil || s.ID == "" {
		panic("Attempted to call redisKey() on nil session")
	}
	return "session:" + string(s.ID)
}

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
		return Session{}, err
	}
	_, err = ExpireSession(&session, conn)
	if err != nil {
		return Session{}, err
	}
	return session, nil
}

var errNilSession = errors.New("Nil sessionID requested")

// SessionExists returns whether the session exists in Redis.
func SessionExists(sessionID string, conn redis.Conn) (bool, error) {
	if sessionID == "" {
		return false, errNilSession
	}
	return redis.Bool(conn.Do("exists", "session:"+sessionID))
}

var errNoSessionData = errors.New("Unable to parse session from redis")

// GetSessionByID retrieves a session from redis.
func GetSessionByID(sessionID string, conn redis.Conn) (Session, error) {
	if sessionID == "" {
		return Session{}, errNilSession
	}
	var session Session
	data, err := conn.Do("hgetall", "session:"+sessionID)
	if err != nil {
		log.Print("Error getting session")
		return Session{}, err
	}
	if data == nil || len(data.([]interface{})) == 0 {
		return Session{}, errNoSessionData
	}
	err = redis.ScanStruct(data.([]interface{}), &session)
	if err != nil {
		return Session{}, err
	}
	if session.GameID == "" || session.PlayerID == "" {
		return Session{}, errNoSessionData
	}
	session.ID = UID(sessionID)

	return session, nil
}

func RemoveSession(session *Session, conn redis.Conn) (bool, error) {
	err := conn.Send("MULTI")
	if err != nil {
		return false, err
	}
	err = conn.Send("DEL", session.redisKey())
	if err != nil {
		return false, err
	}
	err = conn.Send("HDEL", "player:"+session.GameID, session.PlayerID)
	if err != nil {
		return false, err
	}
	results, err := redis.Ints(conn.Do("EXEC"))
	if err != nil {
		return false, err
	}
	return results[0] == 1 && results[1] == 1, nil
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
