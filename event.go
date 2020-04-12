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

			var channels [][]interface{}
			err = redis.ScanSlice(data, &channels)
			if err != nil {
				log.Print(goID, " unable to scan slice: ", err)
				return
			}
			log.Print(goID, "Got ", len(channels), " response")
			for i := 0; i < len(channels); i++ {
				ch := channels[i]
				var keyName string
				var events []interface{}
				rest, err := redis.Scan(ch, &keyName, &events)
				if err != nil {
					log.Print(goID, " Unable to scan key ", err)
					return
				}
				log.Print(goID, " Got ", keyName, " -> ", events, ", ", rest)

			}

			log.Print("\n\n", goID, " Checking out some data:", data)
			// We're only reading from one game's event list.
			var channelResponse struct {
				eName string
				eval  []interface{}
			}
			_, err = redis.Scan(data, &channelResponse)
			if err != nil {
				log.Print(err)
			} else {
				log.Print(goID, " got ", channelResponse, " okay")
			}
			/*
				log.Print("Found ", len(channels), " channels")

				for i := 0; i < len(channels); i++ {
					log.Printf("Scanning a channel")
					var channelName string
					_, err = redis.Scan(channels[i].([]interface{}), &channelName)
					log.Printf("It's ", channelName)
				}
			*/

			/*
				var channel string
				streamName := redis.Scan(mainStream, &cannel)

				log.Print(goID, " Here's the base array: ", mainStream)
				log.Print(goID, " with conversion: ", bytesToStrings(resp))
			*/
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

type ChannelResponse struct {
	Key       string
	responses []Event
}
