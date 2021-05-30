package gen

import (
	mathRand "math/rand"
	"reflect"
	"testing/quick"
)

// String generates a random string
func String(rand *mathRand.Rand) string {
	val, err := quick.Value(reflect.TypeOf(new(string)), rand)
	if err {
		panic("Unable to generate a random string")
	}
	return val.Interface().(string)
}

// Bool generates a random bool
func Bool(rand *mathRand.Rand) bool {
	return rand.Intn(2) == 1
}
