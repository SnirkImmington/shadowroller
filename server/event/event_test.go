package event

import (
	mathRand "math/rand"

	"sr/id"
	"sr/roll"
	"sr/test"
)

func randomCoreOfType(rand *mathRand.Rand, ty string) core {
	edit := int64(0)
	if rand.Intn(4) == 0 {
		edit = rand.Int63()
	}
	return core{
		ID:         rand.Int63(),
		Type:       ty,
		Edit:       edit,
		Share:      int(randomShare(rand)),
		PlayerID:   id.GenUIDWith(rand),
		PlayerName: test.RandomString(rand),
	}
}

func randomGlitchy(rand *mathRand.Rand) int {
	if rand.Intn(5) == 0 {
		if rand.Intn(4) == 0 {
			return -1 * rand.Intn(4)
		} else {
			return rand.Intn(4)
		}
	} else {
		return 0
	}
}

// Generate implements quick.Generator for Event.
func RandomEvent(rand *mathRand.Rand) Event {
	core := randomCoreOfType(rand, "")
	ty := rand.Intn(5)
	switch ty {
	case 0: // initiativeRoll
		seized := rand.Intn(4) == 0
		blitzed := !seized && rand.Intn(4) == 0
		diceCount := 1 + rand.Intn(5)
		if blitzed {
			diceCount = 5
		}
		dice, _ := roll.MakeMathRoller(rand).Roll(diceCount)
		core.Type = EventTypeInitiativeRoll
		return &InitiativeRoll{
			core:    core,
			Title:   test.RandomString(rand),
			Base:    5 + rand.Intn(15),
			Dice:    dice,
			Seized:  seized,
			Blitzed: blitzed,
		}
	case 1: // playerJoin
		core.Type = EventTypePlayerJoin
		return &PlayerJoin{core}
	case 2: // roll
		core.Type = EventTypeRoll
		pool := 1 + rand.Intn(20)
		dice, _ := roll.MakeMathRoller(rand).Roll(pool)
		return &Roll{
			core:    core,
			Title:   test.RandomString(rand),
			Dice:    dice,
			Glitchy: randomGlitchy(rand),
		}
	case 3: // edgeRoll
		core.Type = EventTypeEdgeRoll
		pool := 4 + rand.Intn(20)
		rounds, _ := roll.MakeMathRoller(rand).ExplodingSixes(pool)
		return &EdgeRoll{
			core:    core,
			Title:   test.RandomString(rand),
			Rounds:  rounds,
			Glitchy: randomGlitchy(rand),
		}
	case 4: // rerollFailures
		core.Type = EventTypeReroll
		roller := roll.MakeMathRoller(rand)
		origPool := 1 + rand.Intn(20)
		orig, _ := roller.Roll(origPool)
		rerolled, _ := roller.RerollMisses(orig)
		return &Reroll{
			core:    core,
			PrevID:  rand.Int63(),
			Title:   test.RandomString(rand),
			Rounds:  [][]int{rerolled, orig}, // it's still a thing :/
			Glitchy: randomGlitchy(rand),
		}
	default:
		panic("Invalid choice when generating an event!")
	}
}
