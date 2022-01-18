package roll

import (
	"context"
	"shadowroller.net/libsr/test"
	"testing"
)

// mockRoller produces a roller which will roll from dice.
// If asked to roll more dice than provided, it will produce zeroes.
func mockRoller(dice []int) Roller {
	diceChan := make(chan int)
	go func() {
		for _, die := range dice {
			diceChan <- die
		}
		close(diceChan)
	}()
	return NewRoller(diceChan)
}

func TestFill(t *testing.T) {
	ctx := context.Background()

	test.RunParallel(t, "it propagates context error", func(t *testing.T) {
		dice := []int{1, 2, 3, 4, 5, 6}
		roller := mockRoller(dice)
		ctx, cancel := context.WithCancel(ctx)
		cancel()
		rolls := make([]int, len(dice))
		_, err := roller.Fill(ctx, rolls)
		test.AssertError(t, err, "canceled error")
	})
	test.RunParallel(t, "it produces an empty result for an empty input", func(t *testing.T) {
		dice := []int{1, 2, 3, 4}
		roller := mockRoller(dice)
		rolls := make([]int, 0)
		hits, err := roller.Fill(ctx, rolls)
		test.AssertSuccess(t, err, "no context error")
		test.AssertEqual(t, 0, hits)
		test.AssertIntsEqual(t, []int{}, rolls)
	})
	test.RunParallel(t, "it does not report hits for 1-4", func(t *testing.T) {
		dice := []int{1, 2, 3, 4, 1, 2, 3, 4}
		roller := mockRoller(dice)
		hits, err := roller.Fill(ctx, dice)
		test.AssertSuccess(t, err, "no context error")
		test.Assert(t, hits == 0, "hits rolled", 0, hits)
	})
	test.RunParallel(t, "it reports hits for 5 and 6", func(t *testing.T) {
		dice := []int{1, 2, 3, 4, 5, 6}
		roller := mockRoller(dice)
		hits, err := roller.Fill(ctx, dice)
		test.AssertSuccess(t, err, "no context error")
		test.Assert(t, hits == 2, "hits rolled", 2, hits)
	})
	test.RunParallel(t, "it copies straight from the channel", func(t *testing.T) {
		dice := []int{1, 2, 3, 4, 5, 6}
		roller := mockRoller(dice)
		rolled := make([]int, len(dice))
		_, err := roller.Fill(ctx, rolled)
		test.AssertSuccess(t, err, "no context error")
		test.AssertIntsEqual(t, rolled, dice)
	})
}

func TestRoll(t *testing.T) {
	ctx := context.Background()

	test.RunParallel(t, "it propagates context error", func(t *testing.T) {
		dice := []int{1, 2, 3, 4, 5, 6}
		roller := mockRoller(dice)
		ctx, cancel := context.WithCancel(ctx)
		cancel()
		_, _, err := roller.Roll(ctx, len(dice))
		test.AssertError(t, err, "canceled error")
	})
	test.RunParallel(t, "it produces an empty result for an empty input", func(t *testing.T) {
		dice := []int{1, 2, 3, 4}
		roller := mockRoller(dice)
		rolls, hits, err := roller.Roll(ctx, 0)
		test.AssertSuccess(t, err, "no context error")
		test.AssertEqual(t, 0, hits)
		test.AssertIntsEqual(t, []int{}, rolls)
	})
	test.RunParallel(t, "it does not report hits for 1-4", func(t *testing.T) {
		dice := []int{1, 2, 3, 4, 1, 2, 3, 4}
		roller := mockRoller(dice)
		rolled, hits, err := roller.Roll(ctx, len(dice))
		test.AssertSuccess(t, err, "no context error")
		test.AssertIntsEqual(t, dice, rolled)
		test.Assert(t, hits == 0, "hits rolled", 0, hits)
	})
	test.RunParallel(t, "it reports hits for 5 and 6", func(t *testing.T) {
		dice := []int{1, 2, 3, 4, 5, 6}
		roller := mockRoller(dice)
		rolled, hits, err := roller.Roll(ctx, len(dice))
		test.AssertSuccess(t, err, "no context error")
		test.AssertIntsEqual(t, dice, rolled)
		test.Assert(t, hits == 2, "hits rolled", 2, hits)
	})
}

func flatMap(input [][]int) []int {
	results := []int{}
	for _, ints := range input {
		for _, val := range ints {
			results = append(results, val)
		}
	}
	return results
}

func TestExplodingSixes(t *testing.T) {
	ctx := context.Background()

	test.RunParallel(t, "it reports hits from all rounds", func(t *testing.T) {
		dice := []int{1, 2, 3, 4, 5, 6, 6 /**/, 1, 6 /**/, 5}
		roller := mockRoller(dice)
		results, hits, err := roller.ExplodingSixes(ctx, 7)
		test.AssertSuccess(t, err, "no context error")
		test.AssertIntsEqual(t, dice, flatMap(results))
		test.AssertEqual(t, 5, hits)
	})
	test.RunParallel(t, "it produces an empty result for an empty input", func(t *testing.T) {
		dice := []int{1, 2, 3, 4}
		roller := mockRoller(dice)
		rounds, hits, err := roller.ExplodingSixes(ctx, 0)
		test.AssertSuccess(t, err, "no context error")
		test.AssertEqual(t, 0, hits)
		test.AssertIntIntsEqual(t, [][]int{}, rounds)
	})
	test.RunParallel(t, "it rerolls sixes for multiple rounds", func(t *testing.T) {
		dice := []int{1, 2, 4, 5, 6 /**/, 6 /**/, 6 /**/, 6 /**/, 5}
		roller := mockRoller(dice)
		results, hits, err := roller.ExplodingSixes(ctx, 5)
		test.AssertSuccess(t, err, "no context error")
		test.AssertIntsEqual(t, dice, flatMap(results))
		test.AssertEqual(t, 6, hits)
	})
}

func TestRerollMisses(t *testing.T) {
	ctx := context.Background()

	test.RunParallel(t, "it passes context error", func(t *testing.T) {
		ctx, cancel := context.WithCancel(ctx)
		cancel()
		dice := []int{6, 5, 4, 3}
		orig := []int{1, 2, 3, 4, 5, 6}
		roller := mockRoller(dice)
		_, _, err := roller.RerollMisses(ctx, orig)
		test.AssertError(t, err, "context canceled")
	})
	test.RunParallel(t, "it rerolls non-hits", func(t *testing.T) {
		dice := []int{6, 5, 4, 3}
		orig := []int{1, 2, 3, 4, 5, 6}
		roller := mockRoller(dice)
		results, totalHits, err := roller.RerollMisses(ctx, orig)
		test.AssertSuccess(t, err, "no context error")
		test.AssertIntsEqual(t, dice, results)
		test.AssertEqual(t, 4, totalHits)
	})
}

func TestSumDice(t *testing.T) {
	test.RunParallel(t, "it handles the empty case", func(t *testing.T) {
		dice := []int{}
		test.AssertEqual(t, 0, SumDice(dice))
	})
	test.RunParallel(t, "it sums dice", func(t *testing.T) {
		dice := []int{1, 2, 3, 4, 5, 6}
		test.AssertEqual(t, 1+2+3+4+5+6, SumDice(dice))
	})
}
