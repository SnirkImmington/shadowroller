package srserver

import (
	"encoding/json"
	"github.com/gomodule/redigo/redis"
	"log"
	"math/rand"
	"regexp"
)

// EventCore contains the type of events
type EventCore struct {
	//ID   string `json:"id,omitempty"` // specially written by Redis
	Type string `json:"ty",redis:"ty"`
}

// RollEvent is posted when a player rolls dice.
type RollEvent struct {
	EventCore
	PlayerID   string `json:"pID",redis:"pID"`
	PlayerName string `json:"pName",redis:"pName"`
	Roll       []int  `json:"roll",redis:"roll"`
	Title      string `json:"title",redis:"title"`
}

// PlayerJoinEvent is posted when a new player joins the game.
type PlayerJoinEvent struct {
	EventCore
	PlayerID   string `json:"pID",redis:"pID"`
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

var idRegex = regexp.MustCompile(`^([\d]{13})-([\d]+)$`)

func validEventID(id string) bool {
	return idRegex.MatchString(id)
}

func receiveEvents(gameID string) (<-chan string, chan<- bool) {
	// Due to an implicit cast going on, I can't just use return vars here.
	// Events channel is buffered: if there are too many events for our consumer,
	// we will block on the channel push, and we backpressure redis to hold onto
	// events for us.
	eventsChan := make(chan string, 10)
	okChan := make(chan bool)
	go func() {
		goID := rand.Intn(100)

		defer close(eventsChan)

		conn := redisPool.Get()
		defer closeRedis(conn)
		log.Print(goID, " Begin reading events for ", gameID)

		for {
			// See if we've been canceled.
			select {
			case <-okChan:
				log.Printf("%v: Canceling event read for %v", goID, gameID)
				return
			default:
			}

			data, err := redis.Values(conn.Do(
				"XREAD", "BLOCK", 0, "STREAMS", "event:"+gameID, "$",
			))
			if err != nil {
				log.Print(goID, " Error reading stream from ", gameID, ": ", err)
				return
			}

			// data is an array of key, eventlist. We only subscribed to 1 key.
			eventKeyInfo := data[0].([]interface{})
			eventList := eventKeyInfo[1].([]interface{})

			events, err := scanEvents(eventList)
			if err != nil {
				log.Print(goID, " Unable to deserialize event: ", err)
				return
			}
			for _, event := range events {
				reStringed, err := json.Marshal(event)
				if err != nil {
					log.Print(goID, " Unable to write event back to string: ", err)
					continue
				}
				eventsChan <- string(reStringed)
			}
		}
	}()
	return eventsChan, okChan
}

func scanEvents(eventsData []interface{}) ([]map[string]interface{}, error) {
	events := make([]map[string]interface{}, len(eventsData))

	for i := 0; i < len(eventsData); i++ {
		eventInfo := eventsData[i].([]interface{})

		eventID := string(eventInfo[0].([]byte))
		fieldList := eventInfo[1].([]interface{})

		eventValue := fieldList[1].([]byte)

		var event map[string]interface{}
		err := json.Unmarshal(eventValue, &event)
		if err != nil {
			return nil, err
		}
		event["id"] = string(eventID)
		events[i] = event
	}
	return events, nil
}

/*

*3
  *2
    $15 id
    *2
      $7 payload
      $90 CONTENT
  *2
    $15 id
*/
