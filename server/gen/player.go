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

func PlayerID(rand *mathRand.Rand) id.UID {
	return id.GenUIDWith(rand)
}

// Generate implements quick.Generator for Player
func Player(rand *mathRand.Rand) *player.Player {
	return &player.Player{
		ID:          PlayerID(rand),
		Name:        String(rand),
		Hue:         randomHue(rand),
		Username:    String(rand),
		Connections: rand.Intn(3),
		OnlineMode:  OnlineMode(rand),
	}
}

func PlayerInfo(rand *mathRand.Rand) *player.Info {
	return &player.Info{
		ID:     PlayerID(rand),
		Name:   String(rand),
		Hue:    randomHue(rand),
		Online: Bool(rand),
	}
}
