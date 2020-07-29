package sr

import (
	"encoding/json"
	"github.com/gomodule/redigo/redis"
	"log"
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

// EdgeRollEvent is posted when a player pushes the limit to roll dice.
type EdgeRollEvent struct {
	EventCore
	PlayerID   string  `json:"pID"`
	PlayerName string  `json:"pName"`
	Title      string  `json:"title"`
	Rounds     [][]int `json:"rounds"`
}

// PlayerJoinEvent is posted when a new player joins the game.
type PlayerJoinEvent struct {
	EventCore
	PlayerID   string `json:"pID",redis:"pID"`
	PlayerName string `json:"pName",redis:"pName"`
}

// Event interface determines what is sent to postEvent
type Event interface{}

// PostEvent posts an event to Redis and returns the generated ID.
func PostEvent(gameID string, event Event, conn redis.Conn) (string, error) {
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

func ValidEventID(id string) bool {
	return idRegex.MatchString(id)
}

func ReceiveEvents(gameID string, requestID string) (<-chan string, chan<- bool) {
	// Events channel is buffered: if there are too many events for our consumer,
    // we will block on channel send.
	eventsChan := make(chan string, 10)
	okChan := make(chan bool)
	go func() {
		defer close(eventsChan)

		conn := RedisPool.Get()
		defer CloseRedis(conn)

		log.Printf("%vE Begin reading events for %v", requestID, gameID)

		for {
			// See if we've been canceled.
			select {
			case <-okChan:
				log.Printf("%vE: Received cancel signal", requestID)
                log.Printf("%vE << close: signal", requestID)
				return
			default:
			}

			data, err := redis.Values(conn.Do(
				"XREAD", "BLOCK", 0, "STREAMS", "event:"+gameID, "$",
			))
			if err != nil {
				log.Printf(
                    "%vE Error reading stream for %v: %v",
                    requestID, gameID, err,
                )
                log.Printf("%vE << close error: %v", requestID, err)
				return
			}

			// data is an array of key, eventlist. We only subscribed to 1 key.
			eventKeyInfo := data[0].([]interface{})
			eventList := eventKeyInfo[1].([]interface{})

			events, err := ScanEvents(eventList)
			if err != nil {
				log.Printf("%vE Unable to deserialize event: %v", requestID, err)
                log.Printf("%vE << close: redis error: %v", requestID, err)
				return
			}
			for _, event := range events {
				reStringed, err := json.Marshal(event)
				if err != nil {
					log.Printf(
                        "%vE Unable to write event back to string: %v",
                        requestID, err,
                    )
					continue
				}
				eventsChan <- string(reStringed)
                // We don't log sending the event on this side of the channel.
			}
		}
	}()
	return eventsChan, okChan
}

func ScanEvents(eventsData []interface{}) ([]map[string]interface{}, error) {
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
