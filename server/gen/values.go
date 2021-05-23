package gen

import (
	mathRand "math/rand"
	"reflect"
	"testing/quick"
)

func String(rand *mathRand.Rand) string {
	val, err := quick.Value(reflect.TypeOf(new(string)), rand)
	if err {
		panic("Unable to generate a random string")
	}
	return val.Interface().(string)
}
