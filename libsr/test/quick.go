package test

import (
	mathRand "math/rand"
	"reflect"

	"testing/quick"
)

// RandomString produces a random string of < 50 characters, via `testing/quick.Value`
func RandomString(rand *mathRand.Rand) string {
	stringVal, ok := quick.Value(reflect.TypeOf(new(string)), rand)
	if !ok {
		panic("randomString: unable to generate string via quick.Value")
	}
	return stringVal.Interface().(string)
}
