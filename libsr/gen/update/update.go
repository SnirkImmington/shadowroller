package gen

import (
	mathRand "math/rand"

	"shadowroller.net/libsr/gen"
	genEvent "shadowroller.net/libsr/gen/event"

	"shadowroller.net/libsr/player"
	"shadowroller.net/libsr/roll"
	"shadowroller.net/libsr/update"
)

func NewEvent(rand *mathRand.Rand, plr *player.Player) update.Event {
	evt := genEvent.Event(rand, plr)
	return update.ForNewEvent(evt)
}

func ModEventShare(rand *mathRand.Rand, plr *player.Player) update.Event {
	evt := genEvent.Event(rand, plr)
	share := genEvent.Share(rand)
	for share == evt.GetShare() {
		share = genEvent.Share(rand)
	}
	return update.ForEventShare(evt, share)
}

func ModEventUpdate(rand *mathRand.Rand, plr *player.Player) update.Event {
	evt := genEvent.Event(rand, plr)
	var diff map[string]interface{}
	key := gen.String(rand)
	switch rand.Intn(3) {
	case 0:
		diff[key] = rand.Intn(50)
	case 1:
		diff[key] = gen.String(rand)
	case 2:
		diff[key] = rand.Intn(2) == 0
	case 3:
		diff["share"] = genEvent.Share(rand)
	}
	return update.ForEventDiff(evt, diff)
}

func DelEventUpdate(rand *mathRand.Rand) update.Event {
	return update.ForEventDelete(rand.Int63())
}

func SecondChance(rand *mathRand.Rand, plr *player.Player) update.Event {
	rollEvt := genEvent.Roll(rand, plr)
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

func UnfilteredUpdate(rand *mathRand.Rand) update.Update {
	panic("unimplemented")
}
