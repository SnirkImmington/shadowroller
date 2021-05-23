package event

import (
	mathRand "math/rand"
	"reflect"
)

func randomShare(rand *mathRand.Rand) Share {
	return Share(rand.Intn(3))
}

func (s *Share) Generate(rand *mathRand.Rand, size int) reflect.Value {
	return reflect.ValueOf(randomShare(rand))
}
