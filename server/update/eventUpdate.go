package update

import (
	"encoding/json"

	"sr/event"
)

// Event is the interface for updates to events
type Event interface {
	Update

	EventID() int64
	Time() int64
}

// newEvent is an update sent for new events being created
type newEvent struct {
	evt event.Event
}

func (update *newEvent) Type() string {
	return TypeEventNew
}

func (update *newEvent) EventID() int64 {
	return update.evt.GetID()
}

func (update *newEvent) Time() int64 {
	return update.evt.GetID() // New as of event creation time
}

func (update *newEvent) MarshalJSON() ([]byte, error) {
	fields := []interface{}{TypeEventNew, update.evt}
	return json.Marshal(fields)
}

// ForNewEvent constructs an update for a new event
func ForNewEvent(evt event.Event) Event {
	return &newEvent{evt}
}

// eventDiff updates various fields on an event.
type eventDiff struct {
	id   int64
	time int64
	diff map[string]interface{}
}

// Type gets the type of the update
func (update *eventDiff) Type() string {
	return TypeEventMod
}

// EventID gets the ID of the update's event
func (update *eventDiff) EventID() int64 {
	return update.id
}

// Time gets the time of the update's event
func (update *eventDiff) Time() int64 {
	return update.time
}

// MarshalJSON converts the update to JSON.
func (update *eventDiff) MarshalJSON() ([]byte, error) {
	fields := []interface{}{
		TypeEventMod, update.id, update.diff, update.time,
	}
	return json.Marshal(fields)
}

func makeEventDiff(event event.Event) eventDiff {
	return eventDiff{
		id:   event.GetID(),
		time: event.GetEdit(),
		diff: make(map[string]interface{}),
	}
}

// ForEventDiff constructs an update for an event changing
func ForEventDiff(event event.Event, diff map[string]interface{}) Event {
	return &eventDiff{
		id:   event.GetID(),
		time: event.GetEdit(),
		diff: diff,
	}
}

// ForEventShare constructs an update for changing an event share.
func ForEventShare(event event.Event, newShare event.Share) Event {
	update := makeEventDiff(event)
	update.diff["share"] = newShare // TODO make sure we don't need to stringify
	return &update
}

// ForEventRename constructs an update for renaming an event
func ForEventRename(event event.Event, newTitle string) Event {
	update := makeEventDiff(event)
	update.diff["title"] = newTitle
	return &update
}

type reroll struct {
	eventDiff
}

func (r *reroll) Type() string {
	return TypeRollSecondChance
}

// ForSecondChance constructs an update for a second chance roll.
func ForSecondChance(event event.Event, round []int) Event {
	update := makeEventDiff(event)
	update.diff["reroll"] = round
	return &reroll{update}
}

// ForSeizeInitiative constructs an update for a seize the initiative
// initiative roll.
func ForSeizeInitiative(event event.Event) Event {
	update := makeEventDiff(event)
	update.diff["seized"] = true
	return &update
}

// eventDelete is a specific update type for deleting events
type eventDelete struct {
	eventID int64
}

func (update *eventDelete) Type() string {
	return TypeEventDel
}

func (update *eventDelete) EventID() int64 {
	return update.eventID
}

func (update *eventDelete) Time() int64 {
	return 0
}

func (update *eventDelete) MarshalJSON() ([]byte, error) {
	fields := []interface{}{TypeEventDel, update.eventID}
	return json.Marshal(fields)
}

// ForEventDelete constructs an update for deleting an event
func ForEventDelete(eventID int64) Event {
	return &eventDelete{eventID}
}
