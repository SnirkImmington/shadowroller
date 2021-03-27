package sr

import (
	"bytes"
	crypto "crypto/rand"
	"encoding/binary"
	"fmt"
	"log"
	"math"
	"math/rand"
	"sr/config"
	"time"
)

// SeedRand seeds the PRNG with bytes from crypo random (/dev/random)
func SeedRand() {
	buffer := make([]byte, binary.MaxVarintLen64)
	_, err := crypto.Read(buffer)
	if err != nil {
		log.Printf("Error reading bytes from /dev/random: %v", err)
		rand.Seed(time.Now().UnixNano())
		return
	}
	reader := bytes.NewReader(buffer)
	var seed int64
	err = binary.Read(reader, binary.LittleEndian, &seed)
	if err != nil {
		panic(fmt.Sprintf("Unable to get a random int64: %v", err))
	}
	rand.Seed(seed)
}

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

// SumRolls is Array[int].Sum
func SumRolls(roll []int) int {
	result := 0
	for _, die := range roll {
		result = result + die
	}
	return result
}

const rollMax = 6 // RNG uses modulo, anything % 6 is gonna be in { 0, 1, 2, 3, 4, 5 }
const inputByteMax = math.MaxUint8 - ((math.MaxUint8 % rollMax) + 1)

// A note on RNG here:
//
// The crypto API doesn't include a "range" version of the RNG for regular ints.
// It dos have a .Int(max) *big.Int. That seemed like overkill for rolling 1-6,
// so I took a look. This algorithm is based on that implementation and I believe
// it is sound and simple enough to understand.
//
// We assume that crypto.Read will produce random bytes. We assume that each byte
// has a uniform distribution of values, 0 ... 255. We assume the value of each
// byte is independant of the value of any other byte.
//
// We could partition this possible output set via modulo operator %. If we look
// at the output % 8, we can get 8 values: 0, 1, 2, 3, 4, 5, 6, 7.
// For each of thse outputs, there are exactly 32 values in the input set which
// produce the output. The random byte is equally likely to be any of the 8
// answers. So to generate random(0, 7), we can take the byte % 8.
//
// Our dice rolls do not work with this premise as there not the same number of
// input bytes for each output roll. Taking a byte % 6 is more likely to produce
// vaues 0, 1, 2, 3 than 4 and 5. Thus, we choose to partition the input futher.
//
// We choose our maximum desired value inputByteMax as being closest to the byte
// max while still having equal number of members which produce th desired rolls.
// Bytes <= inputByteMax (251) have 42 members which each map to a given roll,
// satisfying the condition that 8 did for 255.
//
// We are able to get random values <= inputByteMax by generating random bytes
// and discarding bytes > inputByteMax. Because we assume independant events, each
// discard does not affect the value of other bytes. Because we assume each value
// 0 .. 255 has a uniform 1/256 chance of appearing in a byte, we should assume
// each value 0 .. inputByteMax has a 1/inputByteMax+1 chance of appearing in a
// byte which is <= inputByteMax.
//
// Because of the difference between inputByteMax and 255, 2% of random bytes will
// be discarded.

// GenerateRolls starts a goroutine that fills rollsChan with rolls
func GenerateRolls() {
	rollsChan = make(chan int, config.RollBufferSize)
	go func() {
		// There's some amount of caching behind the scenes, but it didn't
		// feel right to grab 1 byte at a time from the RNG.
		// As long as the buffer is less than maybe a megabyte, it should be
		// fine. (The max limit is around 1 << 25 bytes from RNG sources.)
		// Even if hardware RNG goes dark for some time, we can still do
		// all the rolls in potentially two buffers. Ultimately, you can't _fix_
		// a throughput issue with more buffering.
		bytes := make([]uint8, config.RollBufferSize)
		for {
			_, err := crypto.Read(bytes)
			// Read will either read to full or report an error.
			if err != nil {
				log.Printf("Error calling roll RNG: %v", err)
				time.Sleep(time.Duration(50) * time.Millisecond)
				continue
			}
			for _, randByte := range bytes {
				if randByte <= inputByteMax {
					// convert 0 .. 5 (result of % 6) to 1 .. 6
					rollsChan <- int((randByte % rollMax) + 1)
				}
				// Just skip bytes between inputByteMax and 255 (2% of bytes)
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
