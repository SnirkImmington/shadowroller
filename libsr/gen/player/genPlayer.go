package player

import (
	mathRand "math/rand"

	"sr/gen"

	"sr/id"
	"sr/player"
)

// randomOnlineMode produces a random OnlineMode
func OnlineMode(rand *mathRand.Rand) player.OnlineMode {
	return player.OnlineMode(rand.Intn(3))
}

func Hue(rand *mathRand.Rand) int {
	return rand.Intn(257)
}

// Generate implements quick.Generator for Player
func Player(rand *mathRand.Rand) *player.Player {
	return &player.Player{
		ID:          id.GenUIDWith(rand),
		Name:        gen.String(rand),
		Hue:         Hue(rand),
		Username:    gen.Alphanumeric(rand),
		Connections: rand.Intn(3),
		OnlineMode:  OnlineMode(rand),
	}
}

func Players(rand *mathRand.Rand) []player.Player {
	lenPlayers := rand.Intn(4) + 1
	result := make([]player.Player, lenPlayers)
	for i := 0; i < lenPlayers; i++ {
		result[i] = *Player(rand)
	}
	return result
}

func Info(rand *mathRand.Rand) *player.Info {
	return &player.Info{
		ID:     id.GenUIDWith(rand),
		Name:   gen.String(rand),
		Hue:    Hue(rand),
		Online: rand.Intn(2) == 0,
	}
}
