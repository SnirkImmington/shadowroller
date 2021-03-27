package event

import (
	"sr/player"
)

// EventTypePlayerJoin is the type of `PlayerJoinEvent`.
const EventTypePlayerJoin = "playerJoin"

// PlayerJoin was triggered when a new player joins a game.
type PlayerJoin struct {
	core
}

// ForPlayerJoin makes the EventCore of a PlayerJoinEvent.
func ForPlayerJoin(player *player.Player) Event {
	return &PlayerJoin{makeCore(EventTypePlayerJoin, player, ShareInGame)}
}
