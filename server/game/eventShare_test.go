package game

import (
	"testing"

	"sr/event"
	"sr/id"
	"sr/player"
	"sr/test"
)

func TestPlayerCanSeeEvent(t *testing.T) {
	t.Parallel()
	plr := &player.Player{
		ID:          id.UID("plr"),
		Name:        "plebby",
		Hue:         12,
		Username:    "pleb14",
		Connections: 1,
		OnlineMode:  player.OnlineModeAuto,
	}
	plr2 := &player.Player{
		ID:          id.UID("plr2"),
		Name:        "plebby the second",
		Hue:         13,
		Username:    "pleb15",
		Connections: 1,
		OnlineMode:  player.OnlineModeAuto,
	}

	evt := event.ForPlayerJoin(plr)
	test.RunParallel(t, "share in game visible", func(t *testing.T) {
		evt.SetShare(event.ShareInGame)
		test.AssertEqual(t, PlayerCanSeeEvent(plr, false, evt), true)
		test.AssertEqual(t, PlayerCanSeeEvent(plr2, true, evt), true)
	})
	test.RunParallel(t, "share private visible only to player", func(t *testing.T) {
		evt.SetShare(event.SharePrivate)
		test.AssertEqual(t, PlayerCanSeeEvent(plr, false, evt), true)
		test.AssertEqual(t, PlayerCanSeeEvent(plr, true, evt), true)
		test.AssertEqual(t, PlayerCanSeeEvent(plr2, false, evt), false)
		test.AssertEqual(t, PlayerCanSeeEvent(plr2, true, evt), false)
	})
	test.RunParallel(t, "share private visible only to player and GMs", func(t *testing.T) {
		evt.SetShare(event.ShareGMs)
		test.AssertEqual(t, PlayerCanSeeEvent(plr, false, evt), true)
		test.AssertEqual(t, PlayerCanSeeEvent(plr, true, evt), true)
		test.AssertEqual(t, PlayerCanSeeEvent(plr2, false, evt), false)
		test.AssertEqual(t, PlayerCanSeeEvent(plr2, true, evt), true)
	})
}

func TestUpdateChannel(t *testing.T) {
	gID := "g"
	pID := id.UID("p")
	test.RunParallel(t, "it produces the in-game channel", func(t *testing.T) {
		test.AssertEqual(t, UpdateChannel(gID, pID, event.ShareInGame), "update:g")
	})
	test.RunParallel(t, "it produces the private channel", func(t *testing.T) {
		test.AssertEqual(t, UpdateChannel(gID, pID, event.SharePrivate), "update:g:p")
	})
	test.RunParallel(t, "it produces the in-game channel", func(t *testing.T) {
		test.AssertEqual(t, UpdateChannel(gID, pID, event.ShareGMs), "update:g:gms")
	})
}
