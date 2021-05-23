package player

import (
	mathRand "math/rand"
	"reflect"

	"sr/id"
	"sr/test"
)

// randomOnlineMode produces a random OnlineMode
func randomOnlineMode(rand *mathRand.Rand) OnlineMode {
	return OnlineMode(rand.Intn(3))
}

func randomHue(rand *mathRand.Rand) int {
	return rand.Intn(257)
}

// Generate implements quick.Generator for Player
func (p *Player) Generate(rand *mathRand.Rand, size int) reflect.Value {
	return reflect.ValueOf(&Player{
		ID:          id.GenUIDWith(rand),
		Name:        test.RandomString(rand),
		Hue:         randomHue(rand),
		Username:    test.RandomString(rand),
		Connections: rand.Intn(3),
		OnlineMode:  randomOnlineMode(rand),
	})
}

func (i *Info) Generate(rand *mathRand.Rand, size int) reflect.Value {
	return reflect.ValueOf(&Info{
		ID:     id.GenUIDWith(rand),
		Name:   test.RandomString(rand),
		Hue:    randomHue(rand),
		Online: rand.Intn(2) == 0,
	})
}
