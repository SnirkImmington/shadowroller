package player

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"sr/id"
	"strings"

	"github.com/gomodule/redigo/redis"
)

// ErrNotFound means a player was not found.
var ErrNotFound = errors.New("player not found")

// OnlineMode is a toggle for show as online/show as offline
type OnlineMode = int

// OnlineModeAuto indicates a player will be shown as online when connected to a game
var OnlineModeAuto OnlineMode

// OnlineModeOnline indicates a player will always be shown as online
var OnlineModeOnline OnlineMode = 1

// OnlineModeOffline indicates a player will always be shown as offline
var OnlineModeOffline OnlineMode = 2

// Player is a user of Shadowroller.
//
// Players may be registered for a number of games.
// Within those games, they may have a number of chars.
type Player struct {
	ID   id.UID `redis:"-"`
	Name string `redis:"name"`
	Hue  int    `redis:"hue"`

	Username    string     `redis:"uname"`
	Connections int        `redis:"connections"`
	OnlineMode  OnlineMode `redis:"onlineMode"`
}

// Info is data other players can see about a player.
// - `username` is not shown.
type Info struct {
	ID     id.UID `json:"id"`
	Name   string `json:"name"`
	Hue    int    `json:"hue"`
	Online bool   `json:"online"`
}

func (p *Player) String() string {
	return fmt.Sprintf(
		"%v (%v / %v)", p.ID, p.Username, p.Name,
	)
}

// MarshalJSON writes a player to JSON. It secifies `online` instead of connections.
func (p *Player) MarshalJSON() ([]byte, error) {
	fields := make(map[string]interface{}, 5)
	fields["id"] = p.ID
	fields["name"] = p.Name
	fields["hue"] = p.Hue
	fields["username"] = p.Username
	fields["online"] = p.IsOnline()
	fields["onlineMode"] = p.OnlineMode
	return json.Marshal(fields)
}

// Info returns game-readable information about the player
func (p *Player) Info() Info {
	return Info{
		ID:     p.ID,
		Name:   p.Name,
		Hue:    p.Hue,
		Online: p.IsOnline(),
	}
}

// IsOnline indicates if a player is actively connected, or has chosen to be seen as such.
func (p *Player) IsOnline() bool {
	switch p.OnlineMode {
	case OnlineModeAuto:
		return p.Connections > 0
	case OnlineModeOnline:
		return true
	case OnlineModeOffline:
		return false
	default:
		log.Printf("Called IsOnline() on %#v", p)
		return false
	}
}

// RedisKey is the key for acccessing player info from redis
func (p *Player) RedisKey() string {
	if p == nil || p.ID == "" {
		panic("Attempted to call redisKey() on nil player")
	}
	return "player:" + string(p.ID)
}

// Make constructs a new Player object, giving it a UID
func Make(username string, name string) Player {
	return Player{
		ID:          id.GenUID(),
		Username:    username,
		Name:        name,
		Hue:         RandomHue(),
		Connections: 0,
		OnlineMode:  OnlineModeAuto,
	}
}

// MapByID maps an array of players to a map
func MapByID(players []Player) map[id.UID]Player {
	result := make(map[id.UID]Player, len(players))
	for _, plr := range players {
		result[plr.ID] = plr
	}
	return result
}

// ErrNilPlayer is returned when an empty string or invalid ID is passed
// to get methods.
var ErrNilPlayer = errors.New("nil PlayerID requested")

// Exists determines if a player with the given ID exists in the database
func Exists(playerID string, conn redis.Conn) (bool, error) {
	if playerID == "" {
		return false, fmt.Errorf(
			"empty PlayerID passed to PlayerExists: %w", ErrNilPlayer,
		)
	}
	return redis.Bool(conn.Do("exists", "player:"+playerID))
}

// GetByID retrieves a player from Redis
func GetByID(playerID string, conn redis.Conn) (*Player, error) {
	if playerID == "" {
		return nil, fmt.Errorf(
			"%w: empty PlayerID passed to GetPlayerByID", ErrNilPlayer,
		)
	}
	var player Player
	data, err := conn.Do("hgetall", "player:"+playerID)
	if errors.Is(err, redis.ErrNil) {
		return nil, fmt.Errorf(
			"%w: %v", ErrNotFound, playerID,
		)
	} else if err != nil {
		return nil, fmt.Errorf(
			"redis error retrieving data for %v: %w", playerID, err,
		)
	}
	if data == nil || len(data.([]interface{})) == 0 {
		return nil, fmt.Errorf(
			"%w: no data for %v", ErrNotFound, playerID,
		)
	}
	err = redis.ScanStruct(data.([]interface{}), &player)
	if err != nil {
		return nil, fmt.Errorf(
			"redis error parsing player %v: %w", playerID, err,
		)
	}
	if player.Username == "" {
		return nil, fmt.Errorf(
			"no data for %v after redis parse: %w", playerID, ErrNilPlayer,
		)
	}
	player.ID = id.UID(playerID)
	return &player, nil
}

// GetIDOf returns the playerID for the given username.
func GetIDOf(username string, conn redis.Conn) (string, error) {
	if username == "" {
		return "", fmt.Errorf("%w: empty username passed to GetPlayerIDOf", ErrNilPlayer)
	}
	playerID, err := redis.String(conn.Do("GET", "player_id:"+username))
	if errors.Is(err, redis.ErrNil) {
		return "", fmt.Errorf(
			"%w: %v", ErrNotFound, username,
		)
	} else if err != nil {
		return "", fmt.Errorf(
			"redis error getting player ID of %v: %w", username, err,
		)
	}
	if playerID == "" {
		return "", fmt.Errorf("%w: %v (empty string stored)", ErrNotFound, username)
	}
	return playerID, nil
}

// GetByUsername retrieves a player based on the username given.
// Returns ErrPlayerNotFound if no player is found.
func GetByUsername(username string, conn redis.Conn) (*Player, error) {
	if username == "" {
		return nil, fmt.Errorf("empty username passed to GetPlayerByUsername")
	}

	playerID, err := redis.String(conn.Do("HGET", "player_ids", username))
	if errors.Is(err, redis.ErrNil) {
		return nil, fmt.Errorf("%w: %v", ErrNotFound, username)
	} else if err != nil {
		return nil, fmt.Errorf("redis error checking `player_ids`: %w", err)
	}
	if playerID == "" {
		return nil, fmt.Errorf("%w: %v (empty string stored)", ErrNotFound, username)
	}

	return GetByID(playerID, conn)
}

// RandomHue creates a random hue value for a player
func RandomHue() int {
	return rand.Intn(360)
}

// ValidName determines if a player name is valid.
// It checks for 1-32 chars with no newlines.
func ValidName(name string) bool {
	return len(name) > 0 && len(name) < 32 && !strings.ContainsAny(name, "\r\n")
}

/*
// GetPlayerCharIDs returns the IDs of all the chars of a player
func GetPlayerCharIDs(playerID UID, conn redis.Conn) ([]UID, error) {
	ids, err := redis.Strings(conn.Do("SGETALL", "chars:"+string(playerID)))
	if err != nil {
		return nil, err
	}
	uids := make([]UID, len(ids))
	for ix, id := range ids {
		uids[ix] = UID(id)
	}
	return uids, nil
}

// GetPlayerChars returns the chars of a given player
func GetPlayerChars(playerID UID, conn redis.Conn) ([]Char, error) {
	ids, err := GetPlayerCharIDs(playerID, conn)
	if err != nil {
		return nil, fmt.Errorf("error from GetPlayerCharIDs: %w", err)
	}
	err = conn.Send("MULTI")
	if err != nil {
		return nil, fmt.Errorf("redis error sending `MULTI`: %w", err)
	}
	found := make([]Char, len(ids))
	for _, charID := range ids {
		err = conn.Send("HGETALL", "char:"+string(charID))
		if err != nil {
			return nil, fmt.Errorf(
				"redis error sending `HGETALL` for %v: %w", charID, err,
			)
		}
	}
	charsData, err := redis.Values(conn.Do("EXEC"))
	if err != nil {
		return nil, fmt.Errorf("redis error sending `EXEC`: %w", err)
	}

	for ix, charData := range charsData {
		var char Char
		err = redis.ScanStruct(charData.([]interface{}), &char)
		if err != nil {
			return nil, fmt.Errorf(
				"redis error parsing char #%v %v: %w", ix, ids[ix], err,
			)
		}
		if char.Name == "" {
			return nil, fmt.Errorf(
				"no data for char #%v %v after redis parse", ix, ids[ix],
			)
		}
		found[ix] = char
	}
	return found, nil
}
*/

// Create adds the given Player to the database
func Create(player *Player, conn redis.Conn) error {
	err := conn.Send("MULTI")
	if err != nil {
		return fmt.Errorf("redis error sending `MULTI`: %w", err)
	}

	err = conn.Send("HSET", "player_ids", player.Username, player.ID)
	if err != nil {
		return fmt.Errorf("redis error sending `player_ids` `HSET`: %w", err)
	}

	playerData := redis.Args{}.Add(player.RedisKey()).AddFlat(player)
	err = conn.Send("HSET", playerData...)
	if err != nil {
		return fmt.Errorf("redis error sending `player:id` `HSET`: %w", err)
	}

	data, err := redis.Ints(conn.Do("Exec"))
	if err != nil {
		return fmt.Errorf("redis error sending `EXEC`: %w", err)
	}

	// expected 1 update for player_ids, n updates for player fields
	if len(data) != 2 || data[0] != 1 || data[1] <= 2 {
		return fmt.Errorf("redis error with multi: expected [1, >1], got %v", data)
	}
	return nil
}

// IncreaseConnections is used when a new connection is established
const IncreaseConnections = +1

// DecreaseConnections is used when a connection is closed
const DecreaseConnections = -1

// ModifyConnections modifies the Connections attribute of a player; used by the subscription handler
func ModifyConnections(playerID id.UID, amount int, conn redis.Conn) (int, error) {
	return redis.Int(conn.Do(
		"HINCRBY", "player:"+playerID, "connections", amount,
	))
}
