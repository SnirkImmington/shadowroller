package update

import (
	"encoding/json"
	"regexp"
)

const (
	TypeEventNew = "+evt" // A new event is created
	TypeEventMod = "~evt" // An event property changes
	TypeEventDel = "-evt" // An event is deleted

	TypeRollSecondChance = "^roll" // A roll is rerolled
	TypeInitSeized       = "!init" // Initiative is seized

	TypePlayerAdd = "+plr" // A player is added to the game
	TypePlayerMod = "~plr" // A player property changes
	TypePlayerDel = "-plr" // A player leaves the game
)

// Update is the basic interface for update structs
type Update interface {
	json.Marshaler
	Type() string // Type of update (see update.UpdateType*)
}

var typeParse = regexp.MustCompile(`^\["([^"]+)`)

// ParseType parses the type of a JSON-encoded update
func ParseType(update string) string {
	match := typeParse.FindStringSubmatch(update)
	if len(match) < 2 {
		return "???"
	}
	if len(match[1]) < 4 {
		return "??"
	}
	return match[1]
}
