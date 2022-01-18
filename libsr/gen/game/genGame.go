package game

import (
	mathRand "math/rand"
	"strings"

	genPlayer "shadowroller.net/libsr/gen/player"

	"shadowroller.net/libsr/game"
	"shadowroller.net/libsr/player"
)

func GameID(rand *mathRand.Rand) string {
	const chars = "abcdefghijklmnopqrstuvwxyz1234567890"
	idLen := rand.Intn(8) + 6
	result := strings.Builder{}
	for i := 0; i < idLen; i++ {
		charIx := rand.Intn(len(chars))
		if err := result.WriteByte(chars[charIx]); err != nil {
			panic("got an error writing to a stringbuilder")
		}
	}
	return result.String()
}

func GameInfo(rand *mathRand.Rand) game.Info {
	gameID := GameID(rand)
	lenPlayers := rand.Intn(4) + 1 // Can have 1 player games
	players := make(map[string]player.Info, lenPlayers)
	numGMs := rand.Intn(2) + 1
	var gms []string

	for i := 0; i < lenPlayers; i++ {
		plr := genPlayer.Info(rand)
		players[plr.ID.String()] = *plr
		if numGMs > 0 {
			gms = append(gms, plr.ID.String())
			numGMs--
		}
	}
	return game.Info{ID: gameID, Players: players, GMs: gms}
}

func GameInfoWithPlayers(rand *mathRand.Rand, players []player.Player) game.Info {
	gameID := GameID(rand)
	playerMap := make(map[string]player.Info, len(players))
	numGMs := rand.Intn(2) + 1
	var gms []string
	for _, player := range players {
		playerMap[player.ID.String()] = player.Info()
		if numGMs > 0 {
			gms = append(gms, player.ID.String())
			numGMs--
		}
	}
	return game.Info{ID: gameID, Players: playerMap, GMs: gms}
}
