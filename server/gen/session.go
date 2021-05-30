package gen

import (
	mathRand "math/rand"
	"reflect"

	"sr/id"
	"sr/session"
)

// SessionID generates a session ID with the given PRNG
func SessionID(rand *mathRand.Rand) id.UID {
	return id.GenSessionIDWith(rand)
}

// Session generates a random session
func Session(rand *mathRand.Rand) *session.Session {
	return &session.Session{
		ID: SessionID(rand),
		GameID: String(rand),
		PlayerID: id.GenUIDWith(rand),
		Persist: Bool(rand),
		Username: String(rand),
	}
}

// SessionGen implements `testing/quick.Generator` for `session.Session`
type SessionGen struct{}

func(*SessionGen) Generate(rand *mathRand.Rand) reflect.Value {
	return reflect.ValueOf(Session(rand))
}
