package id

import (
	cryptoRand "crypto/rand"
	"encoding/base64"
	"encoding/json"
	mathRand "math/rand"
	"strings"
)

// IDBytes is the number of bytes in a regular ID.
const IDBytes = 9

// SessionIDBytes is the number of bytes in a session ID.
const SessionIDBytes = 12

// UID is the base type of random IDs used in Shadowroller.
type UID string

func (uid UID) String() string {
	return string(uid)
}

func (uid UID) MarshalText() ([]byte, error) {
	return []byte(string(uid)), nil
}

func (uid UID) MarshalBinary() ([]byte, error) {
	return []byte(string(uid)), nil
}

// PlayerID is the random ID of players.
type PlayerID UID

// GameID is the human-readable ID of games.
type GameID string

// GenUID creates a new random UID.
func GenUID() UID {
	return UID(encodeBytes(IDBytes))
}

func GenUIDWith(r *mathRand.Rand) UID {
	return UID(encodeBytesWith(r, IDBytes))
}

// GenSessionID generates a session UID, longer than the default.
func GenSessionID() UID {
	return UID(encodeBytes(SessionIDBytes))
}

func GenSessionIDWith(r *mathRand.Rand) UID {
	return UID(encodeBytesWith(r, SessionIDBytes))
}

func encodeBytes(size uint) string {
	bytes := make([]byte, size)
	cryptoRand.Read(bytes)
	return base64.URLEncoding.EncodeToString(bytes)
}

func encodeBytesWith(r *mathRand.Rand, size uint) string {
	bytes := make([]byte, size)
	r.Read(bytes)
	return base64.URLEncoding.EncodeToString(bytes)
}

// MarshalJSON writes the UID as a string.
func (uid UID) MarshalJSON() ([]byte, error) {
	return json.Marshal(string(uid))
}

// URLSafeBase64 replaces older Base64 IDs with URL-safe versions
func URLSafeBase64(id string) string {
	out := strings.ReplaceAll(id, "+", "-")
	return strings.ReplaceAll(out, "/", "_")
}
