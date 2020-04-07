package srserver

import (
	"encoding/json"
	"github.com/gomodule/redigo/redis"
	"time"
)

type EventCore struct {
	Id        int    `json:"id"`
	Type      string `json:"type"`
	Timestamp int64  `json:"ts"`
}

func (core *EventCore) setId(id int) {
	core.Id = id
}

func makeEventCore(eventType string) EventCore {
	return EventCore{
		Type:      eventType,
		Timestamp: time.Now().Unix(),
	}
}

type RollEvent struct {
	EventCore
	PlayerId string `json:"playerId"`
	Roll     []byte `json:"roll"`
}

func makeRollEvent(playerID string, roll []byte) *RollEvent {
	return &RollEvent{makeEventCore("roll"), playerID, roll}
}

type PlayerJoinEvent struct {
	EventCore
	PlayerId   string `json:"playerId"`
	PlayerName string `json:"playerName"`
}

func makePlayerJoinEvent(playerID string, playerName string) *PlayerJoinEvent {
	return &PlayerJoinEvent{
		makeEventCore("playerJoin"), playerID, playerName,
	}
}

type Event interface {
	setId(id int)
}

func postEvent(gameID string, event Event, conn redis.Conn) (int, error) {
	eventId, err := redis.Int(conn.Do("hincrby", "game."+gameID, "event_id", 1))
	if err != nil {
		return -1, err
	}
	event.setId(eventId)
	bytes, err := json.Marshal(event)
	if err != nil {
		return -1, err
	}
	_, err = conn.Do("publish", "game_event:"+gameID, bytes)
	if err != nil {
		return -1, err
	}
	return eventId, nil
}
