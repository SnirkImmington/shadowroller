package roll

import (
	"context"
	mathRand "math/rand"
	"sr/test"
	"testing"
	"time"
)

func TestConstructor(t *testing.T) {
	t.Run("it passes fields through", func(t *testing.T) {
		var source RandBytes = nil
		var ch = make(chan int)
		gen := NewGenerator(source, 2, ch)
		test.AssertEqual(t, source, gen.source)
		test.AssertEqual(t, 2, gen.bufferSize)
		test.AssertEqual(t, ch, gen.channel)
	})
}

func TestContext(t *testing.T) {
	ctx := context.Background()

	t.Run("it does not generate rolls if canceled", func(t *testing.T) {
		ctx, cancel := context.WithCancel(ctx)
		cancel()
		src := mockSource([]byte{111})
		rolls := make(chan int, 10)
		gen := NewGenerator(src, 10, rolls)
		err := gen.Run(ctx)
		// The fact it's terminated is the first thing we're looking for
		test.AssertError(t, err, "context cancel")
		select {
		case roll, ok := <-rolls:
			if ok {
				t.Errorf("Received a roll instead of a close: %v", roll)
			}
		default:
			t.Error("Unable to read from channel without blocking")
		}
		test.AssertEqual(t, 1, src.Len()) // no bytes were read
	})
	t.Run("it stops generating rolls once canceled", func(t *testing.T) {
		ctx, cancel := context.WithCancel(ctx)
		srcChan := make(chan byte, 2)
		src := &channelRandBytes{srcChan}
		ch := make(chan int, 10) // Small buffer so goroutine stops quickly
		go func() {
			// Blocking send some bytes through
			srcChan <- 1
			// Once it's actively reading the channel, we've gotten past the initial
			// check and can cancel here to test the logic
			cancel()
			srcChan <- 2
			// We've done the roll buffer size
			close(srcChan)
		}()
		gen := NewGenerator(src, 2, ch)
		err := gen.Run(ctx) // Should get canceled during the first round
		test.AssertError(t, err, "should have been canceled by context")
	})
}

func TestGeneratorRNG(t *testing.T) {
	ctx := context.Background()

	t.Run("it produces 1-6 consistently", func(t *testing.T) {
		bufferSize := 200
		rollsGenerated := 2000
		ctx, cancel := context.WithCancel(ctx)
		src := mathRand.New(mathRand.NewSource(0)) // PRNG with fixed seed; deterministic test
		rolls := make(chan int, bufferSize)
		gen := NewGenerator(src, bufferSize, rolls)
		go func() {
			err := gen.Run(ctx) // This goroutine leaks if error handling doesn't work properly
			t.Logf("Generator closed: %v", err)
		}()
		sum := 0
		for i := 0; i < rollsGenerated; i++ { // Should have hit every combination of byte
			roll, ok := <-rolls
			test.Assert(t, ok, "generator does not close channel", true, ok)
			if roll < 1 || roll > 6 {
				t.Errorf("roll %v: got %v", i, roll)
			}
			sum += roll
		}
		cancel()
	})

	//
	// Non-deterministic test: If the behavior of the PRNG with a given timestamp seed is not
	// an evenly distributed stream over the range of inputs, this test will fail.
	//
	t.Run("NON-DETERMINISTIC (PRNG seed): output of dice roller is fair", func(t *testing.T) {
		bufferSize := 400
		rollsGenerated := 4000
		ctx, cancel := context.WithCancel(ctx)
		// PRNG with non-fixed seed; non deterministic test
		src := mathRand.New(mathRand.NewSource(time.Now().UnixNano()))
		rolls := make(chan int, bufferSize)
		gen := NewGenerator(src, bufferSize, rolls)
		go func() {
			err := gen.Run(ctx) // This goroutine leaks if error handling doesn't work properly
			t.Logf("Generator closed: %v", err)
		}()
		sum := 0
		for i := 0; i < rollsGenerated; i++ { // Should have hit every combination of byte
			roll, ok := <-rolls
			test.Assert(t, ok, "generator does not close channel", true, ok)
			sum += roll
		}
		cancel()
		// Expected average: 3.5 * 1000
		expectedAverage := 3.5
		average := float64(sum) / float64(rollsGenerated)
		errorBar := 0.05 * expectedAverage
		test.Assert(t, average < expectedAverage+errorBar, "average too high", expectedAverage, average)
		test.Assert(t, average > expectedAverage-errorBar, "average too low", expectedAverage, average)
	})
}
