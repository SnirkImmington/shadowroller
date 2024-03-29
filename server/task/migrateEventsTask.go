package task

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"reflect"

	"sr/event"
	"sr/game"
	"sr/id"
	"sr/log"
	"sr/player"

	"github.com/go-redis/redis/v8"
)

func handleGameMigrationTask(ctx context.Context, client *redis.Client, gameID string) error {
	migratedPlayers := make(map[id.UID]id.UID)
	migratedPlayersByUsername := make(map[string]id.UID)
	knownAliases := make(map[string]id.UID)
	scanner := bufio.NewScanner(os.Stdin)
	selectAPlayer := func() (id.UID, string) {
		skipped := false
		for {
			if skipped {
				log.Print(ctx, "Select a username or skip:")
			} else {
				log.Print(ctx, "Select a username:")
			}
			if !scanner.Scan() {
				panic(fmt.Errorf("unable to read a line from stdin: %w", scanner.Err()))
			}
			playerName := scanner.Text()

			if playerName == "" {
				if skipped {
					return id.UID("0"), ""
				}
				log.Print(ctx, "Empty player name detected - are you sure you want to skip?")
				skipped = true
				continue
			}
			if playerID, found := migratedPlayersByUsername[playerName]; found {
				return playerID, playerName
			}
			log.Printf(ctx, "Could not find player %v", playerName)
		}
	}
	gamePlayers, err := game.GetPlayers(ctx, client, gameID)
	gamePlayersByID := player.MapByID(gamePlayers)
	if err != nil {
		return fmt.Errorf("getting game info: %w", err)
	}
	log.Printf(ctx, "Game %v:", gameID)
	for _, plr := range gamePlayers {
		log.Printf(ctx, "+ %v -> %v", plr.Username, plr.ID)
		migratedPlayersByUsername[plr.Username] = plr.ID
	}

	// Operate on events in batches
	err = streamReadEvents(ctx, client, gameID, func(ctx context.Context, client redis.Cmdable, batch []event.Event, iter int) error {
		log.Printf(ctx, "# Round %v, %v events", iter, len(batch))
		for ix, evt := range batch {
			// Get existing data from event
			eventPlayerID := evt.GetPlayerID()
			eventPlayerName := evt.GetPlayerName()
			log.Printf(ctx, "> %v <", printEvent(evt))
			var migratedPlayerID id.UID = func() id.UID {
				// If we already have a known player, set them
				if foundID, found := migratedPlayers[eventPlayerID]; found {
					foundPlayer := gamePlayersByID[eventPlayerID]
					log.Printf(ctx, "Found %v (%v) -> %v (%v)",
						eventPlayerName, eventPlayerID, foundPlayer.Username, foundID,
					)
					return foundID
				}
				// Check for alias
				if aliasID, aliasFound := knownAliases[eventPlayerName]; aliasFound {
					aliased := gamePlayersByID[aliasID]
					log.Printf(ctx, "Alias %v (%v) -> %v (%v) in event %v, use? [Y/n]",
						eventPlayerName, eventPlayerID, aliased.Username, aliasID, ix,
					)
					if !scanner.Scan() {
						panic(fmt.Errorf("unable to read a line from stdin: %w", scanner.Err()))
					}
					response := scanner.Text()
					if len(response) == 0 || response == "y" {
						log.Printf(ctx, "Using alias %v (%v) -> %v (%v)",
							eventPlayerName, eventPlayerID, aliased.Username, aliasID,
						)
						migratedPlayers[eventPlayerID] = aliasID
						return aliasID
					}
				}
				// Otherwise, prompt
				log.Printf(ctx, "New!!! %v (%v) in event %v", eventPlayerName, eventPlayerID, ix)
				foundID, foundName := selectAPlayer()
				if foundName == "" {
					log.Printf(ctx, "Skipping %v (%v)", eventPlayerName, eventPlayerID)
					return eventPlayerID
				}
				log.Printf(ctx, "New %v (%v) -> %v (%v)",
					eventPlayerName, eventPlayerID, foundName, foundID,
				)
				migratedPlayers[eventPlayerID] = foundID
				knownAliases[eventPlayerName] = foundID
				return foundID
			}()
			// Update the event value
			playerIDValue := reflect.Indirect(reflect.ValueOf(evt)).FieldByName("PlayerID")
			if !playerIDValue.CanSet() {
				return fmt.Errorf("cannot set %#v of %#v", playerIDValue, evt)
			}
			playerIDValue.Set(reflect.ValueOf(migratedPlayerID))
		}
		log.Print(ctx, "# Writing to redis...")
		err = event.BulkUpdate(ctx, client, gameID, batch)
		if err != nil {
			return fmt.Errorf("bulk updating #%v: %w", iter, err)
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("received error from streamRead: %w", err)
	}
	return nil
}
