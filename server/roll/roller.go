package roll

import ()

// Roller is an interface for interpreting die rolls from a channel.
type Roller struct {
	dice <-chan int
}

// NewRoller constructs a new Roller from the given channel.
func NewRoller(dice <- chan int) Roller {
	return Roller{dice: dice}
}

// Roll rolls a given number of dice. It returns the rolls and total hits.
func (r *Roller) Roll(count int) (rolls []int, hits int) {
	rolls = make([]int, count)
	hits = r.Fill(rolls)
	return rolls, hits
}

// Fill replaces the buffer with dice rolls, and reports the number of hits scored.
func (r *Roller) Fill(rolls []int) (hits int) {
	for i := 0; i < len(rolls); i++ {
		roll := <- r.dice
		rolls[i] = roll
		if roll == 5 || roll == 6 {
			hits++
		}
	}
	return hits
}

// ExplodingSixes rolls a number of dice with the rule of Exploding Sixes.
//
// Exploding Sixes applies to rolls which use Edge to Push the Limit: either
// for the whole pool (when used before rolling) or just the Edge stat (used
// after rolling).
func (r *Roller) ExplodingSixes(pool int) (results [][]int, totalHits int) {
	for pool > 0 {
		roundSixes := 0
		rollRound := make([]int, pool)
		for i := 0; i < pool; i++ {
			roll := <- r.dice
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
	return results, totalHits
}

// RerollMisses rolls a number of dice equal to the dice from the original roll
// which were not hits. This corresponds to the "Second Chance" Edge action.
func (r *Roller) RerollMisses(original []int) (result []int, totalHits int) {
	pool := 0
	for _, die := range original {
		if die < 5 {
			pool++
		}
	}
	hits := len(original) - pool
	result = make([]int, pool)
	hits += r.Fill(result)
	return result, hits
}

// SumDice is Array[int].Sum
func SumDice(dice []int) int {
	result := 0
	for _, die := range dice {
		result += die
	}
	return result
}
