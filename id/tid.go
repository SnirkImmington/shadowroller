package id

import (
	"crypto/rand"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"
)

// Number of nanoseconds in a decisecond, our TUID interval.
const tuidMultiplier = 100_000_000

// tuidNoiseSize gives us ~65k TUIDs per interval, <.01% chance of collision @5000/sec.
const tuidNoiseBytes = 2 // 0x01_00_00
const tuidNoiseShift = tuidNoiseBytes * 8
const tuidNoiseSub = 1 << tuidNoiseShift

// TUID is a timestamped unique ID inspired by Twitter's Snowflake IDs.
type TUID int64

// GenTUID generates a new TUID using the current timestamp and crypto/rand noise.
func GenTUID() TUID {
	nowNanos := time.Now().UnixNano()
	noise := TUIDNoise()
	return BuildTUID(nowNanos, noise)
}

// TUIDForNanos generates a TUID for the given timeframe using crypto/rand noise.
func TUIDForNanos(nanos int64) TUID {
	noise := TUIDNoise()
	return BuildTUID(nanos, noise)
}

// TUIDWithNoise generates a TUID using the current timestamp and the given noise.
func TUIDWithNoise(noise int64) TUID {
	nowNanos := time.Now().UnixNano()
	return BuildTUID(nowNanos, noise)
}

// BuildTUID produces a TUID for the closest timeframe using the given timestamp
// and noise.
func BuildTUID(nanos int64, noise int64) TUID {
	decis := nanos / tuidMultiplier
	return TUID((decis << tuidNoiseShift) + noise)
}

// Timestamp retrieves the timestamp information from the given TUID.
func (tuid TUID) Timestamp() time.Time {
	shifted := int64(tuid) / tuidNoiseSub
	return time.Unix(shifted/10, (shifted%10)*tuidMultiplier)
}

func (tuid TUID) String() string {
	return fmt.Sprintf("0x%x", int64(tuid))
}

// ErrInvalidTUID indicates a redis input with an invalid TUID was given
var ErrInvalidTUID = errors.New("tuid: invalid redis value given")

// RedisScan scans a TUID from a redis int64.
func (tuid TUID) RedisScan(src interface{}) error {
	switch src.(type) {
	case int64:
		tuid = TUID(src.(int64))
		return nil
	default:
		log.Printf("Attempted to scan an invalid TUID: %v", src)
		return ErrInvalidTUID
	}
}

// UnmarshalJSON parses an int64 JSON TUID.
func (tuid TUID) UnmarshalJSON(input []byte) error {
	var value int64
	err := json.Unmarshal(input, &value)
	if err != nil {
		return err
	}
	tuid = TUID(value)
	return nil
}

// MarshalJSON encodes a TUID as an int64.
func (tuid TUID) MarshalJSON() ([]byte, error) {
	return json.Marshal(int64(tuid))
}

// TUIDNoise produces a random value for a TUID.
func TUIDNoise() int64 {
	bytes := make([]byte, tuidNoiseBytes)
	rand.Read(bytes)
	n, _ := binary.Varint(bytes)
	if n != tuidNoiseBytes {
		panic("Unable to create an int of noise!")
	}
	return n
}
