package roll

import (
	"context"
	"sr/config"
)

// Rolls is a roll.Roller which is using the roll.CryptoRandSource.
var Rolls Roller

func FlatMap(ints [][]int) []int {
	result := make([]int, len(ints[0]))
	for _, slice := range ints {
		result = append(result, slice...)
	}
	return result
}

// Init starts the roll generator in a separate goroutine. roll.Shutdown() should
// be called when the server is shutting down.
func Init(ctx context.Context) {
	diceChan := make(chan int, config.RollBufferSize)
	src := NewGenerator(CryptoRandSource(), config.RollBufferSize, diceChan)
	Rolls = NewRoller(diceChan)
	go src.Run(ctx)
}
