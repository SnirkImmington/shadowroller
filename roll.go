package sr

import (
	crypto "crypto/rand"
	"encoding/binary"
	"log"
	"math/rand"
	"sr/config"
)

// RerollTypeRerollFailures represents the "Reroll Failures" use of post-roll edge.
const RerollTypeRerollFailures = "rerollFailures"

// ValidRerollType determines if the requested reroll type is valid.
func ValidRerollType(ty string) bool {
	return ty == RerollTypeRerollFailures
}

/*
   Roll Generation

   Dice are rolled in one thread in a buffered way.
   `rollsChan` is buffered, so the goroutine will fill it, while
   consumers can take rolls from it.
   The rolls goroutine will try to keep the buffer full, and will
   spend most of its time sleeping on the channel send.

   The PRNG is re-seeded using hardware randomness.
*/

var rollsChan chan int

// FillRolls performs standard rolls for the given buffer.
// Returns the number of hits obtained.
func FillRolls(rolls []int) (hits int) {
	for i := 0; i < len(rolls); i++ {
		roll := <-rollsChan
		rolls[i] = roll
		if roll == 5 || roll == 6 {
			hits++
		}
	}
	return
}

// ExplodingSixes rolls a pool applying the Rule of Six.
func ExplodingSixes(pool int) (results [][]int) {
	for pool > 0 { // rounds
		sixes := 0
		rollRound := make([]int, pool)
		for i := 0; i < pool; i++ {
			roll := <-rollsChan
			rollRound[i] = roll
			if roll == 6 {
				sixes++
			}
		}
		pool = sixes
		results = append(results, rollRound)
	}
	return results
}

// RerollFailures re-rolls misses in a roll.
func RerollFailures(original []int) []int {
	pool := 0
	for _, die := range original {
		if die < 5 {
			pool++
		}
	}
	result := make([]int, pool)
	FillRolls(result)
	return result

}

// BeginGeneratingRolls starts the roll server and channel
func BeginGeneratingRolls() {
	rollsChan = make(chan int, config.RollBufferSize)
	go func() {
		for {
			seedBytes := make([]byte, 8)
			_, err := crypto.Read(seedBytes)
			if err != nil {
				log.Print("Unable to generate PRNG seed!", err)
			}
			seed, _ := binary.Varint(seedBytes)

			rng := rand.New(rand.NewSource(seed))
			for i := 0; i < config.RollBufferSize; i++ {
				rollsChan <- rng.Intn(6) + 1
			}
		}
	}()
}

func ConvertRolls(in []interface{}) []int {
	out := make([]int, len(in))
	for i, val := range in {
		out[i] = int(val.(float64))
	}
	return out
}

func ConvertRounds(in []interface{}) [][]int {
	out := make([][]int, len(in))
	for i, val := range in {
		array := ConvertRolls(val.([]interface{}))
		out[i] = array
	}
	return out
}
