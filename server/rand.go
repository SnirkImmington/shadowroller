package sr

import (
	"bytes"
	"context"
	cryptoRand "crypto/rand"
	"encoding/binary"
	"fmt"
	mathRand "math/rand"
	"time"

	"sr/log"
)

// SeedRand seeds the PRNG with bytes from crypo random (/dev/random).
func SeedRand(ctx context.Context) {
	buffer := make([]byte, binary.MaxVarintLen64)
	_, err := cryptoRand.Read(buffer)
	if err != nil {
		log.Printf(ctx, "Error reading bytes from /dev/random: %v", err)
		mathRand.Seed(time.Now().UnixNano())
		return
	}
	reader := bytes.NewReader(buffer)
	var seed int64
	err = binary.Read(reader, binary.LittleEndian, &seed)
	if err != nil {
		panic(fmt.Sprintf("Unable to get a random int64: %v", err))
	}
	mathRand.Seed(seed)
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
