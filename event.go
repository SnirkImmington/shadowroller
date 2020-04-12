package srserver

import (
	"encoding/json"
	"github.com/gomodule/redigo/redis"
	"log"
	"math/rand"
)

// EventCore contains the type of events
type EventCore struct {
	ID   string `json:"id,omitempty"`
	Type string `json:"ty"`
}

// RollEvent is posted when a player rolls dice.
type RollEvent struct {
	EventCore
	PlayerID string `json:"pID"`
	Roll     []int  `json:"roll"`
}

// PlayerJoinEvent is posted when a new player joins the game.
type PlayerJoinEvent struct {
	EventCore
	PlayerID   string `json:"pid"`
	PlayerName string `json:"pName"`
}

// Event interface determines what is sent to postEvent
type Event interface {
}

func postEvent(gameID string, event Event, conn redis.Conn) (string, error) {
	bytes, err := json.Marshal(event)
	if err != nil {
		return "", err
	}
	id, err := redis.String(conn.Do("XADD", "event:"+gameID, "*", "payload", bytes))
	if err != nil {
		return "", err
	}
	return id, nil
}

func receiveEvents(gameID string) (<-chan string, chan<- bool) {
	eventsChan := make(chan string, 10)
	okChan := make(chan bool)
	go func() {
		goID := rand.Intn(100)

		defer close(eventsChan)

		conn := redisPool.Get()
		defer conn.Close()
		log.Print(goID, " Begin reading events for ", gameID)

		for {
			// See if we've been canceled.
			select {
			case _ = <-okChan:
				log.Printf("%v: Canceling event read for %v", goID, gameID)
				return
			default:
				log.Print(goID, " not canceled yet")
			}
			log.Print(goID, " Checking Redis")

			resp, err := redis.Values(conn.Do(
				"XREAD", "BLOCK", 0, "STREAMS", "event:"+gameID, "$",
			))
			if err != nil {
				log.Print(goID, " Error reading stream from ", gameID, ": ", err)
				return
			}

			log.Print(goID, " Here's the base array: ")

			log.Print("Scanning channel")
			var channel []string
			resp, err = redis.Scan(resp, &channel)
			if err != nil {
				log.Print(goID, " could not read channel:", err)
			}
			log.Printf("%v Well, got %#v", channel)

			log.Printf("%v %v received ", goID, resp)
			eventsChan <- "got one"
		}
	}()
	return eventsChan, okChan
}
