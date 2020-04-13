package srserver

import (
	"encoding/json"
	"github.com/gomodule/redigo/redis"
	"log"
	"math/rand"
)

// EventCore contains the type of events
type EventCore struct {
	//ID   string `json:"id,omitempty"` // specially written by Redis
	Type string `json:"ty",redis:"ty"`
}

// RollEvent is posted when a player rolls dice.
type RollEvent struct {
	EventCore
	PlayerID string `json:"pID",redis:"pID"`
	Roll     []int  `json:"roll",redis"roll"`
}

// PlayerJoinEvent is posted when a new player joins the game.
type PlayerJoinEvent struct {
	EventCore
	PlayerID   string `json:"pid",redis:"pid"`
	PlayerName string `json:"pName",redis:"pName"`
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
			case <-okChan:
				log.Printf("%v: Canceling event read for %v", goID, gameID)
				return
			default:
				log.Print(goID, " not canceled yet")
			}
			log.Print(goID, " Checking Redis")

			data, err := redis.Values(conn.Do(
				"XREAD", "BLOCK", 0, "STREAMS", "event:"+gameID, "$",
			))
			if err != nil {
				log.Print(goID, " Error reading stream from ", gameID, ": ", err)
				return
			}

			keyInfo := data[0].([]interface{})

			idList := keyInfo[1].([]interface{})
			for i := 0; i < len(idList); i++ {
				idInfo := idList[i].([]interface{})

				id := string(idInfo[0].([]byte))
				fieldList := idInfo[1].([]interface{})
				// We assume there's only one field
				// I think fieldList is at the point where we can use redigo helpers
				value := fieldList[1].([]byte)

				var event map[string]interface{}
				err := json.Unmarshal(value, &event)
				if err != nil {
					log.Print(goID, " Unable to deserialize event: ", err)
					return
				}
				event["id"] = id
				reStringed, err := json.Marshal(event)
				if err != nil {
					log.Print(goID, " Unable to write event back to string: ", err)
					return
				}
				eventsChan <- string(reStringed)
			}
		}
	}()
	return eventsChan, okChan
}
