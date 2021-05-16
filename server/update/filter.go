package update

import (
	"encoding/json"
	"fmt"
	"strings"

	"sr/id"
)

// Excluded is a filter to exclude players from an event
type Filter []string

// ExcludeGMs is a filter to exclude GMs from an event
const FilterGMs = "gms"

// FilteredUpdate is an update that should not be sent to a specific
// player for duplication reasons.
type FilteredUpdate interface {
	Update
	Inner() Update              // Update which should be sent to the player
	Filter() Filter             // ID of player to exclude
	Serialize() (string, error) // Write filtered into -{filter,...} {update}
}

type withFilter struct {
	Update
	filter Filter
}

func (f *withFilter) Filter() Filter {
	return f.filter
}

func (f *withFilter) Inner() Update {
	return f.Update
}

func WithFilters(filters []string, update Update) FilteredUpdate {
	return &withFilter{update, filters}
}

// WithFilterPlayer constructs a FilteredUpdate which excludes the given player.
func WithFilterPlayer(playerID id.UID, update Update) FilteredUpdate {
	if _, ok := update.(FilteredUpdate); ok {
		panic(fmt.Sprintf(
			"update.WithExcludePlayer: cannot nest excluded updates: attempted to exclude %v from %#v",
			playerID, update,
		))
	}
	return &withFilter{update, []string{string(playerID)}}
}

// WithExcludeGMs constructs a FilteredUpdate which excludes the given player.
func WithExcludeGMs(update Update) FilteredUpdate {
	if _, ok := update.(FilteredUpdate); ok {
		panic(fmt.Sprintf(
			"update.WithExcludeGMs: cannot nest excluded updates: attempted to exclude GMs from %#v",
			update,
		))
	}
	return &withFilter{update, []string{"gms"}}
}

// MarshalJSON formats the withFilter as "-filter,... {inner}"
func (f *withFilter) Serialize() (string, error) {
	filter := strings.Join(f.filter, ",")
	inner, err := json.Marshal(f.Update)
	if err != nil {
		return "", fmt.Errorf("exclude %v: marshal inner: %w", filter, err)
	}
	return fmt.Sprintf("-%s %s", filter, inner), nil
}

// ParseExclude attempts to find an exclude ID for the given update text.
// If the exclude is found, it is trimmed from the front of the event.
func ParseExclude(input string) (excludeID id.UID, excludeGMs bool, inner string, found bool) {
	// "-{filters:filter,...} {inner:[\"ty\", ...]}"
	if !strings.HasPrefix(input, "-") {
		return id.UID(""), false, input, false
	}
	// -{parts[0]} {parts[1]}
	parts := strings.SplitN(input[1:], " ", 2)
	if len(parts) != 2 { // Should not happen with well-formatted arguments
		return id.UID(""), false, input, false
	}
	// {filter[,...]} {inner}
	filters, inner := strings.Split(parts[0], ","), parts[1]
	if len(filters) == 0 { // Should not happen with well-formated arguments
		return id.UID(""), false, input, false
	}
	for _, filter := range filters {
		if filter == "gms" {
			excludeGMs = true
		} else {
			excludeID = id.UID(filter)
		}
	}
	return excludeID, excludeGMs, inner, true
}
