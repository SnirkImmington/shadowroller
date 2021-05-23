package gen

import (
	mathRand "math/rand"

	"sr/roll"
	"sr/update"
)

func NewEventUpdate(rand *mathRand.Rand) update.Event {
	evt := Event(rand)
	return update.ForNewEvent(evt)
}

func ModEventShareUpdate(rand *mathRand.Rand) update.Event {
	evt := Event(rand)
	share := Share(rand)
	for share == evt.GetShare() {
		share = Share(rand)
	}
	return update.ForEventShare(evt, share)
}

func ModEventUpdate(rand *mathRand.Rand) update.Event {
	evt := Event(rand)
	var diff map[string]interface{}
	key := String(rand)
	switch rand.Intn(3) {
	case 0:
		diff[key] = rand.Intn(50)
	case 1:
		diff[key] = String(rand)
	case 2:
		diff[key] = rand.Intn(2) == 0
	case 3:
		diff["share"] = Share(rand)
	}
	return update.ForEventDiff(evt, diff)
}

func DelEventUpdate(rand *mathRand.Rand) update.Event {
	return update.ForEventDelete(rand.Int63())
}

func SecondChanceUpdate(rand *mathRand.Rand) update.Event {
	rollEvt := RollEvent(rand)
	reroll, _ := roll.MakeMathRoller(rand).RerollMisses(rollEvt.Dice)
	return update.ForSecondChance(&rollEvt, reroll)
}

// Update generates an update that does not have a filter
func Update(rand *mathRand.Rand) update.Update {
	panic("unimplemented")
}

func FilteredUpdate(rand *mathRand.Rand) update.FilteredUpdate {
	panic("unimplemented")
}

func MaybeFilteredUpdate(rand *mathRand.Rand) update.Update {
	panic("unimplemented")
}
