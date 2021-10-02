package gen

import (
	mathRand "math/rand"
	"strings"
)

const ASCII = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 !@#$%^&*()_+-=\\|[]{}`~'\":;<>,."

func String(rand *mathRand.Rand) string {
	stringLen := rand.Intn(10) + 10
	var result strings.Builder
	for i := 0; i < stringLen; i++ {
		ix := rand.Intn(len(ASCII))
		result.WriteByte(ASCII[ix])
	}
	return result.String()
}

func ASCIILowerRune(rand *mathRand.Rand) rune {
	const lowerLen = 26
	ix := rand.Intn(lowerLen)
	return rune(ASCII[ix])
}

func ASCIILower(rand *mathRand.Rand) string {
	resultLen := rand.Intn(8) + 8
	var result strings.Builder
	for i := 0; i < resultLen; i++ {
		result.WriteRune(ASCIILowerRune(rand))
	}
	return result.String()
}

func AlphanumericRune(rand *mathRand.Rand) rune {
	const alphanumLen = 26 + 26
	ix := rand.Intn(alphanumLen)
	return rune(ASCII[ix])
}

func Alphanumeric(rand *mathRand.Rand) string {
	resultLen := rand.Intn(8) + 8
	var result strings.Builder
	for i := 0; i < resultLen; i++ {
		result.WriteRune(AlphanumericRune(rand))
	}
	return result.String()
}
