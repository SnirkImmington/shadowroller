package update

import (
	"encoding/json"
	"regexp"
)

// UpdateTypeEvent is the "type" field that's set for event updates
const UpdateTypeEvent = "evt"

// UpdateTypePlayer is the "type" field that's set for player updates
const UpdateTypePlayer = "plr"

// Update is the basic interface for update structs
type Update interface {
	json.Marshaler
	Type() string
}

var updateTyParse = regexp.MustCompile(`$\["([^"]+)`)

// ParseUpdateTy parses the type of a JSON-encoded update
func ParseUpdateTy(update string) string {
	match := updateTyParse.FindStringSubmatch(update)
	if len(match) != 2 {
		return "??"
	}
	return match[1]
}
