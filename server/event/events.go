package event

import (
	"encoding/json"
	"fmt"
	"regexp"
	"sr/id"
	"sr/player"
	"strconv"
)

// Event is the common interface of all events.
type Event interface {
	GetID() int64
	GetType() string
	GetPlayerID() id.UID
	GetShare() Share
	SetShare(share Share)
	GetPlayerName() string
	GetEdit() int64
	SetEdit(edited int64)
}

// core is the basic values put into events.
type core struct {
	ID         int64  `json:"id"`             // ID of the event
	Type       string `json:"ty"`             // Type of the event
	Edit       int64  `json:"edit,omitempty"` // Edit time of the event
	Share      int    `json:"share"`          // share state of the event
	PlayerID   id.UID `json:"pID"`            // ID of the player who posted the event
	PlayerName string `json:"pName"`          // Name of the player who posted the event
}

// GetID returns the timestamp ID of the event.
func (c *core) GetID() int64 {
	return c.ID
}

// GetType returns the type of the event.
func (c *core) GetType() string {
	return c.Type
}

// GetPlayerID returns the PlayerID of the player who triggered the event.
func (c *core) GetPlayerID() id.UID {
	return c.PlayerID
}

// GetPlayerName returns the name of the player who triggered the event
// at the time that it happened.
func (c *core) GetPlayerName() string {
	return c.PlayerName
}

// GetEdit gets the event's edit time
func (c *core) GetEdit() int64 {
	return c.Edit
}

// GetShare gets the event's share state
func (c *core) GetShare() Share {
	return Share(c.Share)
}

// SetShare sets the event's share state
func (c *core) SetShare(share Share) {
	c.Share = int(share)
}

// SetEdit updates the event's edit time
func (c *core) SetEdit(edited int64) {
	c.Edit = edited
}

// Parse parses an event from JSON
func Parse(input []byte) (Event, error) {
	var data map[string]interface{}
	err := json.Unmarshal(input, &data)
	if err != nil {
		return nil, fmt.Errorf("could not parse event object: %w", err)
	}
	tyVal, ok := data["ty"]
	if !ok {
		return nil, fmt.Errorf("parsed input did not contain a ty field")
	}
	ty, ok := tyVal.(string)
	if !ok {
		return nil, fmt.Errorf("error retrieving type info for event: got %v", data)
	}

	switch ty {
	case EventTypeRoll:
		var roll Roll
		err = json.Unmarshal(input, &roll)
		return &roll, err

	case EventTypeEdgeRoll:
		var edgeRoll EdgeRoll
		err = json.Unmarshal(input, &edgeRoll)
		return &edgeRoll, err

	case EventTypeReroll:
		var rerollFailures Reroll
		err = json.Unmarshal(input, &rerollFailures)
		return &rerollFailures, err

	case EventTypeInitiativeRoll:
		var initiativeRoll InitiativeRoll
		err = json.Unmarshal(input, &initiativeRoll)
		return &initiativeRoll, err

	case EventTypePlayerJoin:
		var playerJoin PlayerJoin
		err = json.Unmarshal(input, &playerJoin)
		return &playerJoin, err

	default:
		return nil, fmt.Errorf("unknown event type %v", ty)
	}
}

// makeCore produces an EventCore of the given type using the given player.
func makeCore(ty string, player *player.Player, share Share) core {
	return core{
		ID:         id.NewEventID(),
		Type:       ty,
		Edit:       0,
		Share:      int(share),
		PlayerID:   player.ID,
		PlayerName: player.Name,
	}
}

// Hacky workaround for logs to show event type.
// A user couldn't actually write "ty":"foo" in the field, though,
// as it'd come back escaped.
var eventTyParse = regexp.MustCompile(`"ty":"([^"]+)"`)
var eventIDParse = regexp.MustCompile(`"id":(\d+)`)
var eventShareParse = regexp.MustCompile(`"share":(\d+)`)

// ParseTy gives the `ty` field for an event string.
// This should only be used for logging.
func ParseTy(event string) string {
	match := eventTyParse.FindStringSubmatch(event)
	if len(match) != 2 {
		return "??"
	}
	return match[1]
}

// ParseID gives the `id` field for an event ID as a string.
// This should only be used for logging.
func ParseID(event string) string {
	match := eventIDParse.FindStringSubmatch(event)
	if len(match) != 2 {
		return "????????"
	}
	return match[1]
}

// ParseShare gives the `share` field for an event.
func ParseShare(event string) (Share, bool) {
	match := eventShareParse.FindStringSubmatch(event)
	if len(match) != 1 {
		return -1, false
	}
	if share, err := strconv.Atoi(match[1]); err != nil {
		return Share(share), IsShare(share)
	}
	return -1, false
}
