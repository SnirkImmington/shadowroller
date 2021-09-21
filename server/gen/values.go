package gen

import (
	mathRand "math/rand"
	"strings"
)

func String(rand *mathRand.Rand) string {
	const ascii = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 !@#$%^&*()_+-=\\|[]{}`~'\":;<>,."
	stringLen := rand.Intn(10) + 10
	var result strings.Builder
	for i := 0; i < stringLen; i++ {
		ix := rand.Intn(len(ascii))
		result.WriteByte(ascii[ix])
	}
	return result.String()
}
