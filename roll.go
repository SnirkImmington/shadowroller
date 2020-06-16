package srserver

import (
	crypto "crypto/rand"
	"encoding/binary"
	"log"
	"math/rand"
	"srserver/config"
)

/*
   Roll Generation

   Dice are rolled in one thread in a buffered way.
   `rollsChan` is buffered, so the goroutine will fill it, while
   consumers can take rolls from it.
   The rolls goroutine will try to keep the buffer full, and will
   spend most of its time sleeping on the channel send.

   The PRNG is re-seeded using hardware randomness.
*/

var rollsChan = make(chan int, config.RollBufferSize)

func fillRolls(rolls []int) (hits int) {
	for i := 0; i < len(rolls); i++ {
		roll := <-rollsChan
		rolls[i] = roll
		if roll == 5 || roll == 6 {
			hits++
		}
	}
	return
}

func explodingSixes(pool int) (results [][]int) {
	for { // rounds
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

func reroll(original []int) []int {
	pool := 0
	for _, die := range original {
		if die >= 5 {
			pool++
		}
	}
	result := make([]int, pool)
	fillRolls(result)
	return result

}

// BeginGeneratingRolls starts the roll server and channel
func BeginGeneratingRolls() {
	go func() {
		log.Printf("Using PRNG roll seed source: %v", crypto.Reader)
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
