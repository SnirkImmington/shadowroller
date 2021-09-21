package gen

import (
	mathRand "math/rand"

	"sr/id"
	"sr/player"
)

// randomOnlineMode produces a random OnlineMode
func OnlineMode(rand *mathRand.Rand) player.OnlineMode {
	return player.OnlineMode(rand.Intn(3))
}

func randomHue(rand *mathRand.Rand) int {
	return rand.Intn(257)
}

// Generate implements quick.Generator for Player
func Player(rand *mathRand.Rand) *player.Player {
	return &player.Player{
		ID:          id.GenUIDWith(rand),
		Name:        String(rand),
		Hue:         randomHue(rand),
		Username:    String(rand),
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

func PlayerInfo(rand *mathRand.Rand) *player.Info {
	return &player.Info{
		ID:     id.GenUIDWith(rand),
		Name:   String(rand),
		Hue:    randomHue(rand),
		Online: rand.Intn(2) == 0,
	}
}
