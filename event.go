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

			var scanned StreamResponse
			rest, err := redis.Scan(data, &scanned)
			if err != nil {
				log.Print(goID, " unable to scan stream: ", err)
				return
			}
			log.Print(goID, " left to scan: ", rest)
			log.Print(goID, " SUCCESS!! %#v", scanned)
			eventsChan <- "got one"
		}
	}()
	return eventsChan, okChan
}

/*
   chans [
     keyName string
     responses [
         id string
         value HASHMAP
     ]
   ]
*/

type StreamResponse struct {
	Channels []ChannelResponse
}

func (resp *StreamResponse) RedisScan(input interface{}) error {
	log.Printf("Beginning to scan a stream response")
	var channels []ChannelResponse
	var rest = input.([]interface{})
	var err error
	for { // TODO need to loop over rest.
		log.Print("Gonna get a channel response")
		var channel ChannelResponse
		rest, err = redis.Scan(rest, &channel)
		if err != nil {
			return err
		}
		log.Print("Got a channel response!")
		channels = append(channels, channel)
	}
	/*
		err := redis.ScanSlice(input.([]interface{}), &channels)
		if err != nil {
			return err
		}*/
	log.Printf("Response scanned!")
	resp.Channels = channels
	return nil
}

type ChannelResponse struct {
	Key       string
	Responses []EventResponse
}

func (resp *ChannelResponse) RedisScan(input interface{}) error {
	log.Print("Beginning to scan a channel response")
	var key string
	var responses []EventResponse
	rest, err := redis.Scan(input.([]uint8), &key)
	key, err := redis.String(input)
	if err != nil {
		return err
	}
	err = redis.ScanSlice(rest, responses)
	if err != nil {
		return err
	}
	log.Print("Channel response scanned!")
	resp.Key = key
	resp.Responses = responses
	return nil
}

type EventResponse struct {
	ID    string
	Pairs map[string]string
}

func (resp *EventResponse) RedisScan(input interface{}) error {
	var id string
	rest, err := redis.Scan(input.([]interface{}), &id)

	pairs, err := redis.StringMap(rest, err)
	if err != nil {
		return err
	}
	resp.ID = id
	resp.Pairs = pairs
	return nil
}
