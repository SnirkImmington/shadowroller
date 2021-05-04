package roll

import (
	"sr/test"
	"testing"
)

// mockRoller produces a roller which will roll from dice.
// If it is asked to roll more dice than provided, it will
// panic
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

func TestRoll(t *testing.T) {
	t.Run("it does not report hits for 1-4", func(t *testing.T) {
		dice := []int{1, 2, 3, 4, 1, 2, 3, 4}
		roller := mockRoller(dice)
		hits := roller.Fill(dice)
		test.Assert(t, hits == 0, "hits rolled", 0, hits)
	})
	t.Run("it reports hits for 5 and 6", func(t *testing.T) {
		dice := []int{1, 2, 3, 4, 5, 6}
		roller := mockRoller(dice)
		hits := roller.Fill(dice)
		test.Assert(t, hits == 2, "hits rolled", 2, hits)
	})
	t.Run("it copies dice from the channel", func(t *testing.T) {
		dice := []int{1, 2, 3, 4, 5, 6}
		roller := mockRoller(dice)
		rolled, _ := roller.Roll(len(dice))
		test.AssertIntsEqual(t, rolled, dice)
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
	t.Run("it reports hits from all rounds", func(t *testing.T) {
		dice := []int{1, 2, 3, 4, 5, 6, 6,   1, 6,   5}
		roller := mockRoller(dice)
		results, hits := roller.ExplodingSixes(7)
		test.AssertIntsEqual(t, dice, flatMap(results))
		test.AssertEqual(t, 5, hits)
	})
	t.Run("it rerolls sixes for multiple rounds", func(t *testing.T) {
		dice := []int{1, 2, 4, 5, 6,   6,   6,   6,   5}
		roller := mockRoller(dice)
		results, hits := roller.ExplodingSixes(5)
		test.AssertIntsEqual(t, dice, flatMap(results))
		test.AssertEqual(t, 6, hits)
	})
}

func TestRerollMisses(t *testing.T) {
	t.Run("it rerolls non-hits", func(t *testing.T) {
		dice := []int{6, 5, 4, 3}
		orig := []int{1, 2, 3, 4, 5, 6}
		roller := mockRoller(dice)
		results, totalHits := roller.RerollMisses(orig)
		test.AssertIntsEqual(t, dice, results)
		test.AssertEqual(t, 4, totalHits)
	})

}
