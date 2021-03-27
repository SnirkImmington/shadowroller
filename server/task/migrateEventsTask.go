package task

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"reflect"
	"sr/event"
	"sr/game"
	"sr/id"
	"sr/player"

	"github.com/gomodule/redigo/redis"
)

func handleGameMigrationTask(gameID string, conn redis.Conn) error {
	migratedPlayers := make(map[id.UID]id.UID)
	migratedPlayersByUsername := make(map[string]id.UID)
	knownAliases := make(map[string]id.UID)
	scanner := bufio.NewScanner(os.Stdin)
	selectAPlayer := func() (id.UID, string) {
		skipped := false
		for {
			if skipped {
				log.Printf("Select a username or skip:")
			} else {
				log.Printf("Select a username:")
			}
			if !scanner.Scan() {
				panic(fmt.Errorf("unable to read a line from stdin: %w", scanner.Err()))
			}
			playerName := scanner.Text()

			if playerName == "" {
				if skipped {
					return id.UID(0), ""
				}
				log.Printf("Empty player name detected - are you sure you want to skip?")
				skipped = true
				continue
			}
			if playerID, found := migratedPlayersByUsername[playerName]; found {
				return playerID, playerName
			}
			log.Printf("Could not find player %v", playerName)
		}
	}
	gamePlayers, err := game.GetPlayersIn(gameID, conn)
	gamePlayersByID := player.MapByID(gamePlayers)
	if err != nil {
		return fmt.Errorf("getting game info: %w", err)
	}
	log.Printf("Game %v:", gameID)
	for _, plr := range gamePlayers {
		log.Printf("+ %v -> %v", plr.Username, plr.ID)
		migratedPlayersByUsername[plr.Username] = plr.ID
	}

	// Operate on events in batches
	err = streamReadEvents(gameID, func(batch []event.Event, iter int) error {
		log.Printf("# Round %v, %v events", iter, len(batch))
		for ix, evt := range batch {
			// Get existing data from event
			eventPlayerID := evt.GetPlayerID()
			eventPlayerName := evt.GetPlayerName()
			log.Printf("> %v <", printEvent(evt))
			var migratedPlayerID id.UID = func() id.UID {
				// If we already have a known player, set them
				if foundID, found := migratedPlayers[eventPlayerID]; found {
					foundPlayer := gamePlayersByID[eventPlayerID]
					log.Printf("Found %v (%v) -> %v (%v)",
						eventPlayerName, eventPlayerID, foundPlayer.Username, foundID,
					)
					return foundID
				}
				// Check for alias
				if aliasID, aliasFound := knownAliases[eventPlayerName]; aliasFound {
					aliased := gamePlayersByID[aliasID]
					log.Printf("Alias %v (%v) -> %v (%v) in event %v, use? [Y/n]",
						eventPlayerName, eventPlayerID, aliased.Username, aliasID, ix,
					)
					if !scanner.Scan() {
						panic(fmt.Errorf("unable to read a line from stdin: %w", scanner.Err()))
					}
					response := scanner.Text()
					if len(response) == 0 || response == "y" {
						log.Printf("Using alias %v (%v) -> %v (%v)",
							eventPlayerName, eventPlayerID, aliased.Username, aliasID,
						)
						migratedPlayers[eventPlayerID] = aliasID
						return aliasID
					}
				}
				// Otherwise, prompt
				log.Printf("New!!! %v (%v) in event %v", eventPlayerName, eventPlayerID, ix)
				foundID, foundName := selectAPlayer()
				if foundName == "" {
					log.Printf("Skipping %v (%v)", eventPlayerName, eventPlayerID)
					return eventPlayerID
				}
				log.Printf("New %v (%v) -> %v (%v)",
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
		log.Printf("# Writing to redis...")
		err = event.BulkUpdate(gameID, batch, conn)
		if err != nil {
			return fmt.Errorf("bulk updating #%v: %w", iter, err)
		}
		return nil
	}, conn)
	if err != nil {
		return fmt.Errorf("received error from streamRead: %w", err)
	}
	return nil
}
