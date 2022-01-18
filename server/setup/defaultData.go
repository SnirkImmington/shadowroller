package setup

import (
	"context"
	"strings"

	"shadowroller.net/libsr/config"
	"sr/game"
	"sr/log"
	srOtel "shadowroller.net/libsr/otel"
	"sr/player"

	"github.com/go-redis/redis/v8"
)

func addHardcodedGames(ctx context.Context, client redis.Cmdable) error {
	ctx, span := srOtel.Tracer.Start(ctx, "setup.addHardcodedGames")
	defer span.End()
	gameKeys, err := client.Keys(ctx, "game:*").Result()
	if err != nil {
		return srOtel.WithSetErrorf(span, "reading games from redis: %w", err)
	}
	for i, gameKey := range gameKeys {
		gameKeys[i] = gameKey[5:]
	}
	log.Printf(ctx, "Games (%v): %v", len(gameKeys), gameKeys)
	if !config.IsProduction && len(gameKeys) < len(config.HardcodedGameNames) {
		log.Printf(ctx, "Creating games %v", config.HardcodedGameNames)
		for i, game := range config.HardcodedGameNames {
			_, err := client.HMSet(ctx, "game:"+game, "event_id", 0).Result()
			if err != nil {
				return srOtel.WithSetErrorf(span, "unable to add game #%v, %v: %w", i+1, game, err)
			}
		}
	}
	return nil
}

func addHardcodedPlayers(ctx context.Context, client redis.Cmdable) error {
	ctx, span := srOtel.Tracer.Start(ctx, "setup.AddHardcodedPlayers")
	defer span.End()
	playerKeys, err := client.Keys(ctx, "player:*").Result()
	if err != nil {
		return srOtel.WithSetErrorf(span, "reading player keys from redis: %w", err)
	}
	playerMapping, err := client.HGetAll(ctx, "player_ids").Result()
	if err != nil {
		return srOtel.WithSetErrorf(span, "reading player ID mapping from redis: %w", err)
	}
	players := make([]string, len(playerKeys))
	if err != nil {
		return srOtel.WithSetErrorf(span, "reading players from redis: %w", err)
	}
	for i, playerKey := range playerKeys {
		playerID := playerKey[7:]
		for username, mappedID := range playerMapping {
			if mappedID == playerID {
				players[i] = username
				break
			}
		}
		if players[i] == "" {
			log.Printf(ctx, "Need player_ids mapping for %v", playerID)
		}
	}
	log.Printf(ctx, "Players (%v): %v", len(players), players)
	if !config.IsProduction && len(players) < len(config.HardcodedUsernames) {
		log.Printf(ctx, "Adding %v to all games", config.HardcodedUsernames)
		games := config.HardcodedGameNames
		for _, username := range config.HardcodedUsernames {
			plr := player.Make(username, strings.Title(username))
			err := player.Create(ctx, client, &plr)
			if err != nil {
				return srOtel.WithSetErrorf(span, "creating %v: %w", username, err)
			}
			for _, gameID := range games {
				err := game.AddPlayer(ctx, client, gameID, &plr)
				if err != nil {
					return srOtel.WithSetErrorf(span, "adding %v to %v: %w", username, gameID, err)
				}
			}
		}
	}
	return nil
}

// CheckGamesAndPlayers adds the game names from the config to Redis
// if missing, and prints existing games and players.
func CheckGamesAndPlayers(ctx context.Context, client redis.Cmdable) {
	ctx, span := srOtel.Tracer.Start(ctx, "setup.CheckGamesAndPlayers")
	defer span.End()
	if err := addHardcodedGames(ctx, client); err != nil {
		panic(srOtel.WithSetErrorf(span, "Error adding hardcoded games: %w", err))
	}
	if err := addHardcodedPlayers(ctx, client); err != nil {
		panic(srOtel.WithSetErrorf(span, "Error adding hardcoded players: %w", err))
	}
}
