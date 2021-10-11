package player

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"strings"

	"sr/id"
	srOtel "sr/otel"
	redisUtil "sr/redis"

	"github.com/go-redis/redis/v8"
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

// MarshalJSON writes a player to JSON. It specifies `online` instead of connections.
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
func Exists(ctx context.Context, client redis.Cmdable, playerID string) (bool, error) {
	ctx, span := srOtel.Tracer.Start(ctx, "player.Exists")
	defer span.End()
	if playerID == "" {
		return false, srOtel.WithSetErrorf(span,
			"empty PlayerID passed to PlayerExists: %w", ErrNilPlayer,
		)
	}
	intVal, err := client.Exists(ctx, "player:"+playerID).Result()
	return intVal == 1, err
}

// GetByID retrieves a player from Redis
func GetByID(ctx context.Context, client redis.Cmdable, playerID string) (*Player, error) {
	ctx, span := srOtel.Tracer.Start(ctx, "player.GetByID")
	defer span.End()
	if playerID == "" {
		return nil, srOtel.WithSetErrorf(span,
			"%w: empty PlayerID passed to player.GetByID", ErrNilPlayer,
		)
	}
	var player Player
	result := client.HGetAll(ctx, "player:"+playerID)
	resultMap, err := result.Result()
	if errors.Is(err, redis.Nil) {
		return nil, srOtel.WithSetErrorf(span,
			"%w: %v", ErrNotFound, playerID,
		)
	} else if err != nil {
		return nil, srOtel.WithSetErrorf(span,
			"redis error retrieving data for %v: %w", playerID, err,
		)
	}
	if resultMap == nil || len(resultMap) == 0 {
		return nil, srOtel.WithSetErrorf(span,
			"%w: no data for %v", ErrNotFound, playerID,
		)
	}
	err = result.Scan(&player)
	if err != nil {
		return nil, srOtel.WithSetErrorf(span,
			"scanning player %v: %w", playerID, err,
		)
	}
	if player.Username == "" {
		return nil, srOtel.WithSetErrorf(span,
			"no data for %v after redis parse: %w", playerID, ErrNilPlayer,
		)
	}
	player.ID = id.UID(playerID)
	return &player, nil
}

// GetIDOf returns the playerID for the given username.
func GetIDOf(ctx context.Context, client redis.Cmdable, username string) (string, error) {
	ctx, span := srOtel.Tracer.Start(ctx, "player.GetIDOf")
	defer span.End()
	if username == "" {
		return "", srOtel.WithSetErrorf(span, "%w: empty username passed to player.GetIDOf", ErrNilPlayer)
	}
	playerID, err := client.HGet(ctx, "player_ids", username).Result()
	if errors.Is(err, redis.Nil) {
		return "", srOtel.WithSetErrorf(span,
			"%w: %v", ErrNotFound, username,
		)
	} else if err != nil {
		return "", srOtel.WithSetErrorf(span,
			"redis error getting player ID of %v: %w", username, err,
		)
	}
	if playerID == "" {
		return "", srOtel.WithSetErrorf(span, "%w: %v (empty string stored)", ErrNotFound, username)
	}
	return playerID, nil
}

// GetByUsername retrieves a player based on the username given.
// Returns ErrPlayerNotFound if no player is found.
func GetByUsername(ctx context.Context, client redis.Cmdable, username string) (*Player, error) {
	ctx, span := srOtel.Tracer.Start(ctx, "player.GetByUsername")
	defer span.End()
	if username == "" {
		return nil, srOtel.WithSetErrorf(span, "%w: empty username passed to player.GetByUsername", ErrNilPlayer)
	}

	playerID, err := client.HGet(ctx, "player_ids", username).Result()
	if errors.Is(err, redis.Nil) {
		return nil, srOtel.WithSetErrorf(span, "%w: %v", ErrNotFound, username)
	} else if err != nil {
		return nil, srOtel.WithSetErrorf(span, "redis error checking `player_ids`: %w", err)
	}
	if playerID == "" {
		return nil, srOtel.WithSetErrorf(span, "%w: %v (empty string stored)", ErrNotFound, username)
	}

	return GetByID(ctx, client, playerID)
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
func GetPlayerCharIDs(playerID UID) ([]UID, error) {
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
func GetPlayerChars(playerID UID) ([]Char, error) {
	ids, err := GetPlayerCharIDs(playerID, conn)
	if err != nil {
		return nil, srOtel.WithSetErrorf(span, "error from GetPlayerCharIDs: %w", err)
	}
	err = conn.Send("MULTI")
	if err != nil {
		return nil, srOtel.WithSetErrorf(span, "redis error sending `MULTI`: %w", err)
	}
	found := make([]Char, len(ids))
	for _, charID := range ids {
		err = conn.Send("HGETALL", "char:"+string(charID))
		if err != nil {
			return nil, srOtel.WithSetErrorf(span,
				"redis error sending `HGETALL` for %v: %w", charID, err,
			)
		}
	}
	charsData, err := redis.Values(conn.Do("EXEC"))
	if err != nil {
		return nil, srOtel.WithSetErrorf(span, "redis error sending `EXEC`: %w", err)
	}

	for ix, charData := range charsData {
		var char Char
		err = redis.ScanStruct(charData.([]interface{}), &char)
		if err != nil {
			return nil, srOtel.WithSetErrorf(span,
				"redis error parsing char #%v %v: %w", ix, ids[ix], err,
			)
		}
		if char.Name == "" {
			return nil, srOtel.WithSetErrorf(span,
				"no data for char #%v %v after redis parse", ix, ids[ix],
			)
		}
		found[ix] = char
	}
	return found, nil
}
*/

// Create adds the given player to the database
func Create(ctx context.Context, client redis.Cmdable, player *Player) error {
	ctx, span := srOtel.Tracer.Start(ctx, "player.Create")
	defer span.End()
	if player == nil {
		return srOtel.WithSetErrorf(span, "%w: nil player passed to player.Create", ErrNilPlayer)
	}
	var setUsername *redis.IntCmd
	var setPlayer *redis.IntCmd
	playerMap, err := redisUtil.StructToStringMap(player)
	if err != nil {
		return srOtel.WithSetErrorf(span, "unable to serialize player %v: %w", player, err)
	}
	_, err = client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		setUsername = pipe.HSet(ctx, "player_ids", player.Username, player.ID)
		setPlayer = pipe.HSet(ctx, player.RedisKey(), playerMap)
		return nil
	})
	if err != nil {
		return srOtel.WithSetErrorf(span, "running pipeline: %w", err)
	}
	if err := setUsername.Err(); err != nil {
		return srOtel.WithSetErrorf(span, "setting username: %w", err)
	}
	if count, err := setPlayer.Result(); err != nil || count < int64(len(playerMap)) {
		return srOtel.WithSetErrorf(span,
			"expected %v fields to be added to player, got %v (%v)",
			len(playerMap), count, err,
		)
	}
	return nil
}

// IncreaseConnections is used when a new connection is established
const IncreaseConnections = +1

// DecreaseConnections is used when a connection is closed
const DecreaseConnections = -1

// ModifyConnections modifies the Connections attribute of a player; used by the subscription handler
func ModifyConnections(ctx context.Context, client redis.Cmdable, playerID id.UID, amount int) (int64, error) {
	return client.HIncrBy(ctx, "player:"+string(playerID), "connections", int64(amount)).Result()
}
