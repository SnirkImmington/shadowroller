package gen

import (
	mathRand "math/rand"

	"sr/event"
	"sr/roll"
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

func RollEvent(rand *mathRand.Rand) event.Roll {
	plr := Player(rand)
	pool := 1 + rand.Intn(20)
	dice, _ := roll.MakeMathRoller(rand).Roll(pool)
	return event.ForRoll(
		plr,
		Share(rand),
		String(rand),
		dice,
		Glitchy(rand),
	)
}

func PushLimitEvent(rand *mathRand.Rand) event.EdgeRoll {
	plr := Player(rand)
	pool := 4 + rand.Intn(20)
	rounds, _ := roll.MakeMathRoller(rand).ExplodingSixes(pool)
	return event.ForEdgeRoll(
		plr,
		Share(rand),
		String(rand),
		rounds,
		Glitchy(rand),
	)
}

func RerollEvent(rand *mathRand.Rand) event.Reroll {
	plr := Player(rand)
	prev := RollEvent(rand)
	rerolled, _ := roll.MakeMathRoller(rand).RerollMisses(prev.Dice)
	return event.ForReroll(
		plr,
		&prev,
		[][]int{rerolled, prev.Dice},
	)
}

func InitiativeRollEvent(rand *mathRand.Rand) event.InitiativeRoll {
	plr := Player(rand)
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
		String(rand),
		5+rand.Intn(12),
		dice,
		seized,
		blitzed,
	)
}

func PlayerJoinEvent(rand *mathRand.Rand) event.Event {
	plr := Player(rand)
	return event.ForPlayerJoin(plr)
}

// Generate implements quick.Generator for Event.
func Event(rand *mathRand.Rand) event.Event {
	ty := rand.Intn(5)
	switch ty {
	case 0: // initiativeRoll
		evt := InitiativeRollEvent(rand)
		return &evt
	case 1: // playerJoin
		return PlayerJoinEvent(rand)
	case 2: // roll
		evt := RollEvent(rand)
		return &evt
	case 3: // edgeRoll
		evt := PushLimitEvent(rand)
		return &evt
	case 4: // rerollFailures
		evt := RerollEvent(rand)
		return &evt
	default:
		panic("Invalid choice when generating an event!")
	}
}
