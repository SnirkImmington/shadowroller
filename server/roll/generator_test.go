package roll

import (
	"context"
	mathRand "math/rand"
	"sr/test"
	"testing"
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
}

// BenchmarkDiceRolls benchmarks the time to _read_ dice from the channel, and
// checks that the average is within the desired bounds of the expected average.
//
// This is mostly a test of the system's CryptoRandSource (/dev/random). Running
// on a high-end desktop, we can read 1000 rolls through a channel in 0.5ms.
// In any realistic setting, rolling dice isn't going to be a bottleneck - we
// can roll faster than we can push through the network (probably even localhost).
func BenchmarkDiceRolls(b *testing.B) {
	bufferSize := 10
	rollsPerRound := 1000
	p := 0.01 // Percentage different from expected roll average
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	// PRNG with non-fixed seed; non deterministic test
	src := CryptoRandSource() // Use hardware RNG
	rolls := make(chan int, bufferSize)
	gen := NewGenerator(src, bufferSize, rolls)
	go func() {
		err := gen.Run(ctx)
		b.Logf("Generator closed: %v", err)
	}()

	//
	// Non-deterministic pass/fail: depends on behavior of hardware RNG.
	//
	b.Run("output of dice roller is fair", func(b *testing.B) {
		sum := 0
		totalRolled := 0
		for r := 0; r < b.N; r++ {
			for i := 0; i < rollsPerRound; i++ {
				roll := <-rolls
				sum += roll
			}
			totalRolled += rollsPerRound
		}
		b.StopTimer()
		expectedAverage := 3.5
		average := float64(sum) / float64(totalRolled)
		errorBar := p * expectedAverage

		if average > expectedAverage + errorBar {
			b.Errorf("average too high: expected %v, got %v in %v rolls", expectedAverage, average, totalRolled)
		} else if average < expectedAverage - errorBar {
			b.Errorf("average too low: expected %v, got %v in %v rolls", expectedAverage, average, totalRolled)
		}
	})
}
