package srserver

import (
	"encoding/json"
	"github.com/gomodule/redigo/redis"
	"log"
)

// EventCore contains the id and type fields for events.
type EventCore struct {
	ID   string `json:"id"`
	Type string `json:"ty"`
}

func makeEventCore(eventType string) EventCore {
	return EventCore{
		Type: eventType,
	}
}

// RollEvent is posted when a player rolls dice.
type RollEvent struct {
	EventCore
	PlayerID string `json:"pID"`
	Roll     []int  `json:"roll"`
}

func makeRollEvent(playerID string, roll []int) *RollEvent {
	return &RollEvent{makeEventCore("roll"), playerID, roll}
}

// PlayerJoinEvent is posted when a new player joins the game.
type PlayerJoinEvent struct {
	EventCore
	PlayerID   string `json:"pid"`
	PlayerName string `json:"pName"`
}

func makePlayerJoinEvent(playerID string, playerName string) *PlayerJoinEvent {
	return &PlayerJoinEvent{
		makeEventCore("playerJoin"), playerID, playerName,
	}
}

// Event interface determines what is sent to postEvent
type Event interface {
}

func postEvent(gameID string, event Event, conn redis.Conn) (string, error) {
	bytes, err := json.Marshal(event)
	if err != nil {
		return "", err
	}
	id, err := redis.String(conn.Do("XADD", "event:"+gameID, "payload", bytes))
	if err != nil {
		return "", err
	}
	return id, nil
}

func receiveEvents(gameID string) (<-chan string, chan<- bool) {
	eventsChan := make(chan string, 10)
	okChan := make(chan bool)
	go func() {
		defer close(eventsChan)
		conn := redisPool.Get()
		defer conn.Close()
		log.Print("Begin reading events for ", gameID)

		for {
			// See if we've been cancelled.
			select {
			case _ = <-okChan:
				log.Printf("Cancelling event read for ", gameID)
				return
			}

			resp, err := redis.Values(conn.Do(
				"XREAD", "BLOCK", 0, "STREAMS", "event:"+gameID, "$",
			))
			if err != nil {
				log.Print("Error reading stream from ", gameID, ": ", err)
				return
			}
			log.Print("received ", resp)
			eventsChan <- "got one"
		}
	}()
	return eventsChan, okChan
}
