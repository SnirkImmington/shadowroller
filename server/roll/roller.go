package roll

import (
	"context"
	"errors"
)

var ErrChannelClosed = errors.New("dice channel closed")

// Roller is an interface for interpreting die rolls from a channel.
type Roller struct {
	dice <-chan int
}

// NewRoller constructs a new Roller from the given channel.
func NewRoller(dice <-chan int) Roller {
	return Roller{dice: dice}
}

// Roll rolls a given number of dice. It returns the rolls and total hits.
// An error is returned if the context is cancelled; results are undefined in this case.
func (r *Roller) Roll(ctx context.Context, count int) (rolls []int, hits int, err error) {
	rolls = make([]int, count)
	hits, err = r.Fill(ctx, rolls)
	return rolls, hits, err
}

// Fill replaces the buffer with dice rolls, and reports the number of hits scored.
func (r *Roller) Fill(ctx context.Context, rolls []int) (hits int, err error) {
	for i := 0; i < len(rolls); i++ {
		roll, ok := <-r.dice
		if !ok {
			return 0, ErrChannelClosed
		}
		rolls[i] = roll
		if roll == 5 || roll == 6 {
			hits++
		}
	}
	return hits, ctx.Err()
}

// ExplodingSixes rolls a number of dice with the rule of Exploding Sixes.
//
// Exploding Sixes applies to rolls which use Edge to Push the Limit: either
// for the whole pool (when used before rolling) or just the Edge stat (used
// after rolling).
// An error is returned if the context is cancelled; results are undefined in this case.
func (r *Roller) ExplodingSixes(ctx context.Context, pool int) (results [][]int, totalHits int, err error) {
	for pool > 0 {
		roundSixes := 0
		rollRound := make([]int, pool)
		for i := 0; i < pool; i++ {
			roll, ok := <-r.dice
			if !ok {
				return results, 0, ErrChannelClosed
			}
			rollRound[i] = roll
			if roll == 5 || roll == 6 {
				totalHits++
			}
			if roll == 6 {
				roundSixes++
			}
		}
		pool = roundSixes
		results = append(results, rollRound)
	}
	return results, totalHits, ctx.Err()
}

// RerollMisses rolls a number of dice equal to the dice from the original roll
// which were not hits. This corresponds to the "Second Chance" Edge action.
// An error is returned if the context is cancelled; results are undefined in this case.
func (r *Roller) RerollMisses(ctx context.Context, original []int) (result []int, totalHits int, err error) {
	pool := 0
	for _, die := range original {
		if die < 5 {
			pool++
		}
	}
	hits := len(original) - pool
	result = make([]int, pool)
	newHits, err := r.Fill(ctx, result)
	return result, hits + newHits, err
}

// SumDice is Array[int].Sum
func SumDice(dice []int) int {
	result := 0
	for _, die := range dice {
		result += die
	}
	return result
}
