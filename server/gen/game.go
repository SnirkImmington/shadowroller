package gen

import (
	mathRand "math/rand"
	"reflect"
	"strings"

	"sr/id"
	"sr/game"
	"sr/player"
)

// GameID produces a random game ID
func GameID(rand *mathRand.Rand) string {
	return string(id.GenUIDWith(rand))
}

// UpdateChannel produces a random update channel
func UpdateChannel(rand *mathRand.Rand) string {
	return game.UpdateChannel(
		GameID(rand),
		PlayerID(rand),
		Share(rand),
	)
}

// GameInfo generates a game.Info
func GameInfo(rand *mathRand.Rand) *game.Info {
	numPlayers := rand.Intn(8)
	players := make(map[string]player.Info, numPlayers)
	var gms []string
	for i := 0; i < numPlayers; i++ {
		player := PlayerInfo(rand)
		players[string(player.ID)] = *player
		if rand.Intn(5) == 0 {
			gms = append(gms, string(player.ID))
		}
	}

	return &game.Info{
		ID: GameID(rand), // Somewhat limited for a game ID
		Players: players,
		GMs: gms,
	}
}

// GameInfoGen implements `testing/quick.Generator` for `*game.Info`
type GameInfoGen struct{}

func (*GameInfoGen) Generate(rand *mathRand.Rand) reflect.Value {
	return reflect.ValueOf(GameInfo(rand))
}

func stringsContains(input []string, value string) bool {
	for _, s := range input {
		if s == value {
			return true
		}
	}
	return false
}

func Packet(rand *mathRand.Rand) *game.Packet {
	channel := UpdateChannel(rand)
	isGMChannel := strings.Contains(channel, ":gm:")

	var filters []string

	// This can generate two gm filters
	filterGms := !isGMChannel && Bool(rand)
	if filterGms {
		filters = append(filters, "gm")
	}

	if Bool(rand) {
		filters = append(filters, string(PlayerID(rand)))
	}

	return &game.Packet{
		Channel: channel,
		Filter: filters,
		Update: Update(rand),
	}
}

// PacketGen implements `testing/quick.Generator` for `game.Packet`
type PacketGen struct{}

func (*PacketGen) Generate(rand *mathRand.Rand) reflect.Value {
	return reflect.ValueOf(Packet(rand))
}
