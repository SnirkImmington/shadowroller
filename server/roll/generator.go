package roll

import (
	"context"
	"fmt"
	"math"
	//	"sr/shutdown"
)

// Generator is an object which sends rolls from its RollSource through its channel.
//
// source := roll.NewCryptoRollSource()
// rollsChan := make(chan int)
// generator := roll.NewGenerator(source, rollsChan)
// go roller.Run()
// roller := roll.NewRoller(rollsChan)
type Generator struct {
	source     RandBytes
	bufferSize int
	channel    chan int
}

// NewGenerator constructs a new Generator whose Run() will forward
// rolls from source to channel, which must be a buffered channel.
func NewGenerator(source RandBytes, bufferSize int, channel chan int) Generator {
	return Generator{source: source, bufferSize: bufferSize, channel: channel}
}

const rollMax = 6
const inputByteMax = math.MaxUint8 - ((math.MaxUint8 % rollMax) + 1)

// Run continuously fills g's channel with rolls which have been generated
// from its source. Run will terminate when ctx is canceled or when the source
// returns an error.
func (g *Generator) Run(ctx context.Context) error {
	defer close(g.channel)
	select {
	case <-ctx.Done():
		return ctx.Err()
	default: // don't block to check channel
	}
	buffer := make([]uint8, g.bufferSize)
	for {
		_, err := g.source.Read(buffer)
		if err != nil {
			return fmt.Errorf("from rand source: %w", err)
		}

		for _, randByte := range buffer {
			// We need to filter out bytes which we can't modulo into a roll.
			// This only drops some random bytes. In the absolute worst case
			// scenario, (with a broken RNG) we call g.source.Read() twice
			// between checks for done.
			if randByte > inputByteMax {
				continue
			}

			// We use modulo to turn the random byte into a roll (into 0-5, +1).
			// This is fair after discarding values > rollMax.
			roll := int((randByte % rollMax) + 1)
			select { // Block to send next byte or be notified of shutdown
			case <-ctx.Done():
				return ctx.Err()
			case g.channel <- roll:
				continue
			}
		}
	}
}
