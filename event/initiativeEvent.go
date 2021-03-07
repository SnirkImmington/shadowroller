package event

import (
	"sr/player"
)

// EventTypeInitiativeRoll is the type of `InitiativeRollEvent`.
const EventTypeInitiativeRoll = "initiativeRoll"

// InitiativeRoll is an event for a player's initiative roll.
type InitiativeRoll struct {
	core
	Title string `json:"title"`
	Base  int    `json:"base"`
	Dice  []int  `json:"dice"`
}

// ForInitiativeRoll makes an InitiativeRollEvent.
func ForInitiativeRoll(player *player.Player, share Share, title string, base int, dice []int) InitiativeRoll {
	return InitiativeRoll{
		core:  makeCore(EventTypeInitiativeRoll, player, share),
		Title: title,
		Base:  base,
		Dice:  dice,
	}
}
