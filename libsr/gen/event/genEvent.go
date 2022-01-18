package event

import (
	mathRand "math/rand"

	"shadowroller.net/libsr/gen"

	"shadowroller.net/libsr/event"
	"shadowroller.net/libsr/player"
	"shadowroller.net/libsr/roll"
)

func Glitchy(rand *mathRand.Rand) int {
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

func Share(rand *mathRand.Rand) event.Share {
	return event.Share(rand.Intn(3))
}

func Roll(rand *mathRand.Rand, plr *player.Player) event.Roll {
	pool := 1 + rand.Intn(20)
	dice, _ := roll.MakeMathRoller(rand).Roll(pool)
	return event.ForRoll(
		plr,
		Share(rand),
		gen.String(rand),
		dice,
		Glitchy(rand),
	)
}

func PushLimit(rand *mathRand.Rand, plr *player.Player) event.EdgeRoll {
	pool := 4 + rand.Intn(20)
	rounds, _ := roll.MakeMathRoller(rand).ExplodingSixes(pool)
	return event.ForEdgeRoll(
		plr,
		Share(rand),
		gen.String(rand),
		rounds,
		Glitchy(rand),
	)
}

func Reroll(rand *mathRand.Rand, plr *player.Player) event.Reroll {
	prev := Roll(rand, plr)
	rerolled, _ := roll.MakeMathRoller(rand).RerollMisses(prev.Dice)
	return event.ForReroll(
		plr,
		&prev,
		[][]int{rerolled, prev.Dice},
	)
}

func InitiativeRoll(rand *mathRand.Rand, plr *player.Player) event.InitiativeRoll {
	seized := rand.Intn(4) == 0
	blitzed := !seized && rand.Intn(4) == 0
	diceCount := 1 + rand.Intn(5)
	if blitzed {
		diceCount = 5
	}
	dice, _ := roll.MakeMathRoller(rand).Roll(diceCount)
	return event.ForInitiativeRoll(
		plr,
		Share(rand),
		gen.String(rand),
		5+rand.Intn(12),
		dice,
		seized,
		blitzed,
	)
}

func PlayerJoin(rand *mathRand.Rand, plr *player.Player) event.Event {
	return event.ForPlayerJoin(plr)
}

// Generate implements quick.Generator for Event.
func Event(rand *mathRand.Rand, plr *player.Player) event.Event {
	ty := rand.Intn(5)
	switch ty {
	case 0: // initiativeRoll
		evt := InitiativeRoll(rand, plr)
		return &evt
	case 1: // playerJoin
		return PlayerJoin(rand, plr)
	case 2: // roll
		evt := Roll(rand, plr)
		return &evt
	case 3: // edgeRoll
		evt := PushLimit(rand, plr)
		return &evt
	case 4: // rerollFailures
		evt := Reroll(rand, plr)
		return &evt
	default:
		panic("Invalid choice when generating an event!")
	}
}
