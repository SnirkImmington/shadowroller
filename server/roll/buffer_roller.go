package roll

import (
	mathRand "math/rand"
)

type MathRoller struct {
	rand *mathRand.Rand
}

func MakeMathRoller(rand *mathRand.Rand) *MathRoller {
	return &MathRoller{rand}
}

func (r *MathRoller) RollDie() int {
	return 1 + r.rand.Intn(6)
}

func (r *MathRoller) Roll(count int) (rolls []int, hits int) {
	rolls = make([]int, count)
	hits = r.Fill(rolls)
	return rolls, hits
}

func (r *MathRoller) Fill(rolls []int) (hits int) {
	for i := 0; i < len(rolls); i++ {
		die := r.RollDie()
		rolls[i] = die
		if die == 5 || die == 6 {
			hits++
		}
	}
	return hits
}

func (r *MathRoller) ExplodingSixes(pool int) (results [][]int, totalHits int) {
	for pool > 0 {
		roundSixes := 0
		rollRound := make([]int, pool)
		for i := 0; i < pool; i++ {
			die := r.RollDie()
			rollRound[i] = die
			if die == 5 {
				totalHits++
			} else if die == 6 {
				totalHits++
				roundSixes++
			}
		}
		pool = roundSixes
		results = append(results, rollRound)
	}
	return results, totalHits
}

func (r *MathRoller) RerollMisses(original []int) (result []int, totalHits int) {
	pool := 0
	for _, die := range original {
		if die < 5 {
			pool++
		}
	}
	hits := len(original) - pool
	result = make([]int, pool)
	newHits := r.Fill(result)
	return result, hits + newHits
}
