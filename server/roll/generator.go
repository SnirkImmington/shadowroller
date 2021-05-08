
package roll

import (
	"fmt"
	"sr/config"
	"context"
	"time"
	"math"
	"log"
)

// Generator is an object which sends rolls from its RollSource through its channel.
//
// source := roll.NewCryptoRollSource()
// rollsChan := make(chan int)
// generator := roll.NewGenerator(source, rollsChan)
// go roller.Run()
// roller := roll.NewRoller(rollsChan)
type Generator struct {
	source RandBytes
	channel chan int
}

func NewGenerator(source RandBytes, channel chan int) Generator {
	return Generator{source: source, channel: channel}
}

const rollMax = 6
const inputByteMax = math.MaxUint8 - ((math.MaxUint8 % rollMax) + 1)

// Run continually
func (g *Generator) Run(ctx context.Context) error {
	buffer := make([]uint8, config.RollBufferSize)
	var prevError error
	for {
		_, err := g.source.Read(buffer)
		if err != nil {
			if prevError != nil {
				return fmt.Errorf("Received two errors in a row: %s and now %w", prevError, err)
			} else {
				time.Sleep(time.Duration(50) * time.Millisecond)
				prevError = err
			}
		}

		for _, randByte := range buffer {
			if randByte <= inputByteMax {
				select {
				case g.channel <- int((randByte % rollMax) + 1):
					continue
				case <- ctx.Done():
					close(g.channel)
					return ctx.Err()
				default:
					log.Printf("Got the default case of the select!!")
				}
			}
		}
	}
}
