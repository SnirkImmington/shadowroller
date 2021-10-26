package roll

import (
	"context"

	"sr/config"
	srOtel "sr/otel"
	"sr/shutdown"
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
	ctx, span := srOtel.Tracer.Start(ctx, "roll.Generator.Run")
	ctx, release := shutdown.Register(ctx, "roll generation")
	go func() {
		defer release()
		defer span.End()
		err := src.Run(ctx)
		if err != nil {
			srOtel.WithSetError(span, err)
		}
	}()
}
