package task

import (
	"fmt"
	"github.com/gomodule/redigo/redis"
	"log"
	"sr/event"
	"sr/id"
)

const bufferSize = 200

func streamReadEvents(gameID string, callback func([]event.Event, int) error, conn redis.Conn) error {
	count := 1
	newestID := fmt.Sprintf("%v", id.NewEventID())
	for {
		log.Printf("> %v read events older than %v", count, newestID)
		events, err := event.GetOlderThan(gameID, newestID, bufferSize, conn)
		if err != nil {
			return fmt.Errorf("getting %v events older than %v: %w",
				bufferSize, newestID, err,
			)
		}
		if len(events) == 1 {
			log.Printf("> Found all the events!")
			return nil
		}
		log.Printf("> %v found %v / %v events", count, len(events), bufferSize)
		foundEvents := make([]event.Event, len(events))
		for i, eventText := range events {
			evt, err := event.Parse([]byte(eventText))
			if err != nil {
				return fmt.Errorf("could not parse event #v, %v: %w",
					i, eventText, err,
				)
			}
			foundEvents[i] = evt
		}

		if err = callback(foundEvents, count); err != nil {
			return fmt.Errorf("from callback on round %v: %w", count, err)
		}
		count++
		newestID = fmt.Sprintf("%v", foundEvents[len(foundEvents)-1].GetID())
	}
	return nil
}

func printEvent(evt event.Event) string {
	switch evt.(type) {
	case *event.Roll:
		roll := evt.(*event.Roll)
		if roll.Title != "" {
			return fmt.Sprintf("%v rolls %v dice to %v",
				roll.PlayerName, len(roll.Dice), roll.Title,
			)
		}
		return fmt.Sprintf("%v rolls %v dice",
			roll.PlayerName, len(roll.Dice))
	case *event.EdgeRoll:
		edgeRoll := evt.(*event.EdgeRoll)
		if edgeRoll.Title != "" {
			return fmt.Sprintf("%v edge rolls %v rounds to %v",
				edgeRoll.PlayerName, len(edgeRoll.Rounds), edgeRoll.Title,
			)
		}
		return fmt.Sprintf("%v edge rolls %v rounds",
			edgeRoll.PlayerName, len(edgeRoll.Rounds))
	case *event.Reroll:
		reroll := evt.(*event.Reroll)
		if reroll.Title != "" {
			return fmt.Sprintf("%v rerolls %v dice to %v",
				reroll.PlayerName, len(reroll.Rounds[1]), reroll.Title,
			)
		}
		return fmt.Sprintf("%v rerolls %v dice",
			reroll.PlayerName, len(reroll.Rounds[1]),
		)
	case *event.InitiativeRoll:
		initRoll := evt.(*event.InitiativeRoll)
		title := "initiative"
		if initRoll.Title != "" {
			title = initRoll.Title
		}
		return fmt.Sprintf("%v rolls %v + %vd6 for %v",
			initRoll.PlayerName, initRoll.Base, initRoll.Dice, title,
		)
	case *event.PlayerJoin:
		join := evt.(*event.PlayerJoin)
		return fmt.Sprintf("%v joined <game>.",
			join.PlayerName,
		)
	default:
		return fmt.Sprintf("Unknown %#v", evt)
	}
}
