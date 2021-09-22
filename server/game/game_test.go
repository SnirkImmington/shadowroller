package game_test

import (
	"context"
	"sort"
	"strings"
	"testing"

	genGame "sr/gen/game"
	genPlayer "sr/gen/player"

	"sr/game"
	"sr/player"
	"sr/test"
)

func TestExists(t *testing.T) {
	ctx := context.Background()
	rng := test.RNG()
	_, client := test.GetRedis(t)

	gameID := genGame.GameID(rng)

	err := game.Create(ctx, client, gameID)
	test.AssertSuccess(t, err, "game created")

	test.RunParallel(t, "existant game", func(t *testing.T) {
		found, err := game.Exists(ctx, client, gameID)
		test.AssertSuccess(t, err, "game found")
		test.AssertCheck(t, gameID, found, "game found")
	})

	test.RunParallel(t, "non-existant game", func(t *testing.T) {
		invalidGameID := genGame.GameID(rng)
		found, err := game.Exists(ctx, client, invalidGameID)
		test.AssertSuccess(t, err, "finding game")
		test.AssertCheck(t, invalidGameID, !found, "game not found")
	})
}

func TestHasGM(t *testing.T) {
	ctx := context.Background()
	rng := test.RNG()
	_, client := test.GetRedis(t)

	test.RunParallel(t, "with one GM set", func(t *testing.T) {
		gameID := genGame.GameID(rng)
		err := game.Create(ctx, client, gameID)
		test.AssertSuccess(t, err, "game created")

		plr := genPlayer.Player(rng)
		err = player.Create(ctx, client, plr)
		test.AssertSuccess(t, err, "player created")
		err = game.AddGM(ctx, client, gameID, plr.ID)
		test.AssertSuccess(t, err, "gm added")

		found, err := game.GetGMs(ctx, client, gameID)
		test.AssertSuccess(t, err, "gms found")
		test.AssertEqual(t, []string{plr.ID.String()}, found)
	})

	test.RunParallel(t, "with multiple GMs set", func(t *testing.T) {
		gameID := genGame.GameID(rng)
		err := game.Create(ctx, client, gameID)
		test.AssertSuccess(t, err, "game created")

		plr := genPlayer.Player(rng)
		err = player.Create(ctx, client, plr)
		test.AssertSuccess(t, err, "player created")
		err = game.AddGM(ctx, client, gameID, plr.ID)
		test.AssertSuccess(t, err, "gm added")

		plr2 := genPlayer.Player(rng)
		err = player.Create(ctx, client, plr2)
		test.AssertSuccess(t, err, "player created")
		err = game.AddGM(ctx, client, gameID, plr2.ID)
		test.AssertSuccess(t, err, "gm added")

		found, err := game.GetGMs(ctx, client, gameID)
		test.AssertSuccess(t, err, "gms found")
		expected := []string{plr.ID.String(), plr2.ID.String()}
		sort.Strings(expected)
		sort.Strings(found)
		test.AssertEqual(t, expected, found)
	})

	test.RunParallel(t, "with no GMs", func(t *testing.T) {
		gameID := genGame.GameID(rng)
		err := game.Create(ctx, client, gameID)
		test.AssertSuccess(t, err, "game created")

		found, err := game.GetGMs(ctx, client, gameID)
		test.AssertSuccess(t, err, "gms found")
		test.AssertEqual(t, []string{}, found)
	})

	test.RunParallel(t, "with invalid game", func(t *testing.T) {
		invalidGameID := genGame.GameID(rng)
		found, err := game.GetGMs(ctx, client, invalidGameID)
		test.AssertSuccess(t, err, "no difference between empty result and no key")
		test.AssertEqual(t, []string{}, found)
	})
}

type Players []player.Player

var _ sort.Interface = (Players)(nil)

func (p Players) Len() int {
	return len([]player.Player(p))
}

func (p Players) Less(i int, j int) bool {
	plrs := []player.Player(p)
	return strings.Compare(plrs[i].ID.String(), plrs[j].ID.String()) < 0
}

func (p Players) Swap(i int, j int) {
	plrs := []player.Player(p)
	plrs[i], plrs[j] = plrs[j], plrs[i]
}

func TestGetPlayers(t *testing.T) {
	ctx := context.Background()
	rng := test.RNG()
	_, client := test.GetRedis(t)

	gameID := genGame.GameID(rng)
	test.Must(t, game.Create(ctx, client, gameID))

	test.RunParallel(t, "many players", func(t *testing.T) {
		players := genPlayer.Players(rng)
		gameID := genGame.GameID(rng)
		test.Must(t, game.Create(ctx, client, gameID))
		for _, plr := range players {
			test.Must(t,
				player.Create(ctx, client, &plr),
				game.AddPlayer(ctx, client, gameID, &plr),
			)
		}

		found, err := game.GetPlayers(ctx, client, gameID)
		sort.Sort(Players(players))
		sort.Sort(Players(found))
		test.AssertSuccess(t, err, "players found")
		test.AssertEqual(t, players, found) // Order happens to line up
	})

	test.RunParallel(t, "one player", func(t *testing.T) {
		plr := genPlayer.Player(rng)
		gameID := genGame.GameID(rng)
		test.Must(t, game.Create(ctx, client, gameID))
		test.Must(t,
			player.Create(ctx, client, plr),
			game.AddPlayer(ctx, client, gameID, plr),
		)

		found, err := game.GetPlayers(ctx, client, gameID)
		test.AssertSuccess(t, err, "players found")
		test.AssertEqual(t, []player.Player{*plr}, found) // Order happens to line up
	})

	test.RunParallel(t, "non-existant game", func(t *testing.T) {
		invalidGameID := genGame.GameID(rng)
		found, err := game.GetPlayers(ctx, client, invalidGameID)
		test.AssertSuccess(t, err, "on difference for non-existant game")
		test.AssertEqual(t, 0, len(found))
	})
}

func TestGetInfo(t *testing.T) {
	ctx := context.Background()
	rng := test.RNG()
	_, client := test.GetRedis(t)

	test.RunParallel(t, "for existing game", func(t *testing.T) {
		gameID := genGame.GameID(rng)
		test.Must(t, game.Create(ctx, client, gameID))
		players := genPlayer.Players(rng)
		playerInfo := make(map[string]player.Info)
		for _, plr := range players {
			test.Must(t,
				player.Create(ctx, client, &plr),
				game.AddPlayer(ctx, client, gameID, &plr),
			)
			playerInfo[plr.ID.String()] = plr.Info()
		}
		numGms := rng.Intn(len(players))
		gms := make([]string, numGms)
		for i := 0; i < numGms; i++ {
			gmID := players[i].ID
			test.Must(t, game.AddGM(ctx, client, gameID, gmID))
			gms[i] = gmID.String()
		}
		expected := &game.Info{
			ID:      gameID,
			Players: playerInfo,
			GMs:     gms,
		}
		found, err := game.GetInfo(ctx, client, gameID)
		test.AssertSuccess(t, err, "getting game info")
		test.AssertEqual(t, expected, found)
	})
}
