package sr

import (
	"time"
)

// Number of nanoseconds in a millisecond
const tsMultiplier = 1_000_000

// TimestampNow returns the current millisecond timestamp as a float64.
// This function is intented to be used for unique-enough IDs (for things which will only happen once a millisecond).
// It can be mirrored on the frontend via `new Date().valueOf()`.
func TimestampNow() int64 {
	nowNanos := time.Now().UnixNano()
	nowMillis := (nowNanos - (nowNanos % tsMultiplier)) / tsMultiplier
	return nowMillis
}

// NewEventID returns a new ID for an event.
func NewEventID() int64 {
	return TimestampNow()
}
