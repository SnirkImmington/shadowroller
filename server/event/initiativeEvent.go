package event

import (
	"sr/player"
)

// EventTypeInitiativeRoll is the type of `InitiativeRollEvent`.
const EventTypeInitiativeRoll = "initiativeRoll"

// InitiativeRoll is an event for a player's initiative roll.
type InitiativeRoll struct {
	core
	Title   string `json:"title"`
	Base    int    `json:"base"`
	Dice    []int  `json:"dice"`
	Seized  bool   `json:"seized"`
	Blitzed bool   `json:"blitzed"`
}

// ForInitiativeRoll makes an InitiativeRollEvent.
func ForInitiativeRoll(
	player *player.Player, share Share, title string,
	base int, dice []int, seized bool, blitzed bool,
) InitiativeRoll {
	return InitiativeRoll{
		core:    makeCore(EventTypeInitiativeRoll, player, share),
		Title:   title,
		Base:    base,
		Dice:    dice,
		Seized:  seized,
		Blitzed: blitzed,
	}
}
