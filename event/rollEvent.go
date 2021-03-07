package event

import (
	"sr/player"
)

// EventTypeRoll is the type of `RollEvent`s.
const EventTypeRoll = "roll"

// Roll is triggered when a player rolls non-edge dice.
type Roll struct {
	core
	Title   string `json:"title"`
	Dice    []int  `json:"dice"`
	Glitchy int    `json:"glitchy"`
}

// ForRoll makes a RollEvent.
func ForRoll(player *player.Player, share Share, title string, dice []int, glitchy int) Roll {
	return Roll{
		core:    makeCore(EventTypeRoll, player, share),
		Title:   title,
		Dice:    dice,
		Glitchy: glitchy,
	}
}

// EventTypeEdgeRoll is the type of `EdgeRollEvent`s.
const EventTypeEdgeRoll = "edgeRoll"

// EdgeRoll is triggered when a player uses edge before a roll.
type EdgeRoll struct {
	core
	Title   string  `json:"title"`
	Rounds  [][]int `json:"rounds"`
	Glitchy int     `json:"glitchy"`
}

// ForEdgeRoll makes an EdgeRollEvent.
func ForEdgeRoll(player *player.Player, share Share, title string, rounds [][]int, glitchy int) EdgeRoll {
	return EdgeRoll{
		core:    makeCore(EventTypeEdgeRoll, player, share),
		Title:   title,
		Rounds:  rounds,
		Glitchy: glitchy,
	}
}

// EventTypeReroll is the type of `Reroll` events.
const EventTypeReroll = "rerollFailures"

// Reroll is triggered when a player uses edge for Second Chance
// on a roll.
type Reroll struct {
	core
	PrevID  int64   `json:"prevID"`
	Title   string  `json:"title"`
	Rounds  [][]int `json:"rounds"`
	Glitchy int     `json:"glitchy"`
}

// ForReroll constructs a Reroll
func ForReroll(player *player.Player, previous *Roll, rounds [][]int) Reroll {
	return Reroll{
		core:    makeCore(EventTypeReroll, player, previous.GetShare()),
		PrevID:  previous.ID,
		Title:   previous.Title,
		Rounds:  rounds,
		Glitchy: previous.Glitchy,
	}
}
