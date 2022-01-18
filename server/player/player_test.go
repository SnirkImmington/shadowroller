package player_test

import (
	"context"
	"testing"

	"shadowroller.net/libsr/errs"
	"shadowroller.net/libsr/gen"
	genPlayer "shadowroller.net/libsr/gen/player"
	"sr/id"
	"sr/player"
	"sr/test"
)

/*

// This JSON isn't actually supposed to be ser/deser stable - we add an online flag
// instead of connections at the JSON level...

func TestPlayerJSON(t *testing.T) {
	numPlayers := 100
	rng := test.RNG()
	for i := 0; i < numPlayers; i++ {
		plr := genPlayer.Player(rng)
		plrText, err := json.Marshal(plr)
		test.AssertSuccess(t, err, "marshaling player")
		var parsed player.Player
		err = json.Unmarshal(plrText, &parsed)
		test.AssertSuccess(t, err, "unmarshaling player")
		test.AssertEqual(t, plr.Info(), parsed.Info())
		test.AssertEqual(t, plr, &parsed)
	}
}
*/

func TestPlayer_IsOnline(t *testing.T) {
	numPlayers := 50
	rng := test.RNG()
	for i := 0; i < numPlayers; i++ {
		plr := genPlayer.Player(rng)
		plr.OnlineMode = player.OnlineModeOffline
		test.AssertCheck(t, plr, !plr.IsOnline(), "offline mode -> offline")
		plr.OnlineMode = player.OnlineModeOnline
		test.AssertCheck(t, plr, plr.IsOnline(), "online mode -> online")
		plr.OnlineMode = player.OnlineModeAuto
		test.AssertCheck(t, plr,
			plr.IsOnline() == (plr.Connections > 0),
			"auto -> online = connections > 0",
		)
	}
}

func TestPlayer_Info(t *testing.T) {
	numPlayers := 100
	rng := test.RNG()
	for i := 0; i < numPlayers; i++ {
		plr := genPlayer.Player(rng)
		info := plr.Info()
		test.AssertCheck(t, info, plr.ID == info.ID, "ids match")
		test.AssertCheck(t, info, plr.Name == info.Name, "ids match")
		test.AssertCheck(t, info, plr.Hue == info.Hue, "ids match")
		test.AssertCheck(t, info, plr.IsOnline() == info.Online, "ids match")
	}
}

func TestPlayer_RedisKey(t *testing.T) {
	plr := genPlayer.Player(test.RNG())
	test.AssertEqual(t, "player:"+plr.ID.String(), plr.RedisKey())
}

func TestPlayer_Make(t *testing.T) {
	rng := test.RNG()
	username := gen.ASCIILower(rng)
	name := gen.String(rng)
	plr := player.Make(username, name)
	test.AssertCheck(t, plr, plr.ID != "", "id set")
	test.AssertCheck(t, plr, plr.Username == username, "username set")
	test.AssertCheck(t, plr, plr.Name == name, "name set")
	test.AssertCheck(t, plr, plr.Connections == 0, "connections set")
	test.AssertCheck(t, plr, plr.OnlineMode == player.OnlineModeAuto, "online set")
	test.AssertCheck(t, plr, plr.Hue <= 360, "hue set")
}

func TestMapByID(t *testing.T) {
	plrs := genPlayer.Players(test.RNG())
	mapped := player.MapByID(plrs)
	test.AssertEqual(t, len(plrs), len(mapped))
	for _, plr := range plrs {
		test.AssertEqual(t, plr, mapped[plr.ID])
	}
}

func TestExists(t *testing.T) {
	ctx := context.Background()
	_, client := test.GetRedis(t)
	rng := test.RNG()

	plr := genPlayer.Player(rng)

	err := player.Create(ctx, client, plr)
	test.AssertSuccess(t, err, "creating player")

	test.RunParallel(t, "player present", func(t *testing.T) {
		found, err := player.Exists(ctx, client, plr.ID.String())
		test.AssertSuccess(t, err, "finding by ID")
		test.AssertEqual(t, true, found)
	})

	test.RunParallel(t, "player not present", func(t *testing.T) {
		invalidPlayer := genPlayer.Player(rng)
		found, err := player.Exists(ctx, client, invalidPlayer.ID.String())
		test.AssertSuccess(t, err, "checking if found")
		test.AssertEqual(t, false, found)
	})

	test.RunParallel(t, "invalid ID", func(t *testing.T) {
		_, err := player.Exists(ctx, client, "")
		test.AssertError(t, err, "hard error invalid ID")
	})
}

func TestGetByID(t *testing.T) {
	ctx := context.Background()
	_, client := test.GetRedis(t)
	rng := test.RNG()

	plr := genPlayer.Player(rng)

	err := player.Create(ctx, client, plr)
	test.AssertSuccess(t, err, "creating player")

	test.RunParallel(t, "player present", func(t *testing.T) {
		found, err := player.GetByID(ctx, client, plr.ID.String())
		test.AssertSuccess(t, err, "finding by ID")
		test.AssertEqual(t, plr, found)
	})

	test.RunParallel(t, "player not present", func(t *testing.T) {
		invalidPlayer := genPlayer.Player(rng)
		_, err := player.GetByID(ctx, client, invalidPlayer.ID.String())
		test.AssertErrorIs(t, err, errs.ErrNotFound)
	})

	test.RunParallel(t, "invalid id", func(t *testing.T) {
		_, err := player.GetByID(ctx, client, "")
		test.AssertError(t, err, "hard error invalid ID")
	})
}

func TestGetByUsername(t *testing.T) {
	ctx := context.Background()
	_, client := test.GetRedis(t)
	rng := test.RNG()

	plr := genPlayer.Player(rng)

	err := player.Create(ctx, client, plr)
	test.AssertSuccess(t, err, "creating player")

	test.RunParallel(t, "player present", func(t *testing.T) {
		found, err := player.GetByUsername(ctx, client, plr.Username)
		test.AssertSuccess(t, err, "finding player by username")
		test.AssertEqual(t, plr, found)
	})

	test.RunParallel(t, "player not present", func(t *testing.T) {
		invalidPlr := genPlayer.Player(rng)
		_, err := player.GetByUsername(ctx, client, invalidPlr.Username)
		test.AssertErrorIs(t, err, errs.ErrNotFound)
	})

	test.RunParallel(t, "invalid username", func(t *testing.T) {
		_, err := player.GetByUsername(ctx, client, "")
		test.AssertError(t, err, "hard error invalid ID")
	})
}

func TestGetIDOf(t *testing.T) {
	_, client := test.GetRedis(t)
	rng := test.RNG()
	ctx := context.Background()

	plr := genPlayer.Player(rng)

	err := player.Create(ctx, client, plr)
	test.AssertSuccess(t, err, "creating player")

	test.RunParallel(t, "player present", func(t *testing.T) {
		found, err := player.GetIDOf(ctx, client, plr.Username)
		test.AssertSuccess(t, err, "finding player by username")
		test.AssertEqual(t, plr.ID.String(), found)
	})

	test.RunParallel(t, "player not present", func(t *testing.T) {
		invalidPlr := genPlayer.Player(rng)
		_, err := player.GetIDOf(ctx, client, invalidPlr.Username)
		test.AssertErrorIs(t, err, errs.ErrNotFound)
	})

	test.RunParallel(t, "invalid username", func(t *testing.T) {
		_, err := player.GetIDOf(ctx, client, "")
		test.AssertError(t, err, "hard error invalid ID")
	})
}

func TestCreate(t *testing.T) {
	_, client := test.GetRedis(t)
	rng := test.RNG()
	ctx := context.Background()

	test.RunParallel(t, "creates new player", func(t *testing.T) {
		plr := genPlayer.Player(rng)
		err := player.Create(ctx, client, plr)
		test.AssertSuccess(t, err, "player created")

		found, err := player.GetByID(ctx, client, plr.ID.String())
		test.AssertSuccess(t, err, "finding created player")
		test.AssertEqual(t, plr, found)
	})

	test.RunParallel(t, "does not overwrite a player", func(t *testing.T) {
		plr := genPlayer.Player(rng)
		firstID := plr.ID
		secondID := id.GenUID()
		err := player.Create(ctx, client, plr)
		test.AssertSuccess(t, err, "player created")

		plr.ID = secondID // New player with the same username
		err = player.Create(ctx, client, plr)
		test.AssertErrorIs(t, err, errs.ErrBadRequest)

		plr.ID = firstID // Found should have the original player ID
		found, err := player.GetByID(ctx, client, plr.ID.String())
		test.AssertSuccess(t, err, "player was found")
		test.AssertEqual(t, plr, found)
	})

	test.RunParallel(t, "nil player", func(t *testing.T) {
		err := player.Create(ctx, client, nil)
		test.AssertError(t, err, "hard error nil input")
	})
}

func TestModifyConnections(t *testing.T) {
	_, client := test.GetRedis(t)
	rng := test.RNG()
	ctx := context.Background()

	test.RunParallel(t, "increases connections", func(t *testing.T) {
		plr := genPlayer.Player(rng)
		starting := int64(plr.Connections)
		err := player.Create(ctx, client, plr)
		test.AssertSuccess(t, err, "player created")
		increased, err := player.ModifyConnections(ctx, client, plr.ID, player.IncreaseConnections)
		test.AssertSuccess(t, err, "connections increased")
		test.AssertCheck(t, increased, increased > starting, "connections increased")
	})

	test.RunParallel(t, "decreases connections", func(t *testing.T) {
		plr := genPlayer.Player(rng)
		starting := int64(plr.Connections)
		err := player.Create(ctx, client, plr)
		test.AssertSuccess(t, err, "player created")
		increased, err := player.ModifyConnections(ctx, client, plr.ID, player.DecreaseConnections)
		test.AssertSuccess(t, err, "connections decreased")
		test.AssertCheck(t, increased, increased < starting, "connections decreased")
	})
}
