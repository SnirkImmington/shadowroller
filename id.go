package sr

import (
	rand "crypto/rand"
	"encoding/base64"
)

// UID is the base type of random IDs used in Shadowroller.
type UID string

func (uid UID) String() string {
	return string(uid)
}

// PlayerID is the random ID of players.
type PlayerID UID

// GameID is the human-readable ID of games.
type GameID string

// GenUID creates a new random UID.
func GenUID() UID {
	return UID(encodeBytes(9))
}

// GenSessionID generates a session UID, longer than the default.
func GenSessionID() UID {
	return UID(encodeBytes(12))
}

func encodeBytes(size uint) string {
	bytes := make([]byte, size)
	rand.Read(bytes)
	return base64.URLEncoding.EncodeToString(bytes)
}
