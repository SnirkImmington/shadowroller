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

var rollsChan = make(chan byte, config.RollBufferSize)

func generateRolls(channel chan<- byte) {
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
			byteRoll := byte(rng.Intn(5) + 1)
			channel <- byteRoll
		}
	}
}

func BeginGeneratingRolls() {
	go generateRolls(rollsChan)
}
