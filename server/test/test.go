package test

import (
	"errors"
	mathRand "math/rand"
	"reflect"
	"sync"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/go-redis/redis/v8"
)

var once sync.Once
var client *redis.Client
var rdb *miniredis.Miniredis

func setupRedis(t *testing.T) (*miniredis.Miniredis, *redis.Client) {
	db, err := miniredis.Run()
	if err != nil {
		t.Fatalf("Could not initialize miniredis: %v", err)
	}
	opts, err := redis.ParseURL("redis://" + db.Addr())
	if err != nil {
		t.Fatalf("Unable to parse url %v", db.Addr())
	}
	opts.MaxRetries = -1
	opts.PoolSize = 3
	client := redis.NewClient(opts)
	return db, client
}

func GetRedis(t *testing.T) (*miniredis.Miniredis, *redis.Client) {
	once.Do(func() {
		rdb, client = setupRedis(t)
	})
	return rdb, client
}

func RNG() *mathRand.Rand {
	return mathRand.New(mathRand.NewSource(mathRand.Int63()))
}

// Must fails the test on an error result.
func Must(t *testing.T, errs ...error) {
	t.Helper()
	for ix, err := range errs {
		if err != nil {
			if len(errs) == 1 {
				t.Fatalf("test.Must: error %v", err)
			}
			t.Fatalf("t.Must: error %v: %v", ix+1, err)
		}
	}
}

// Assert calls t.ErrorF if cond is false.
func Assert(t *testing.T, cond bool, msg string, expected interface{}, got interface{}) {
	t.Helper()
	if !cond {
		t.Errorf("%v: expected %v, got %v", msg, expected, got)
	}
}

func AssertCheck(t *testing.T, val interface{}, check bool, msg string) {
	t.Helper()
	if !check {
		t.Errorf("check %v failed for %v", msg, val)
	}
}

// AssertSuccess calls t.Error if err is not nil.
func AssertSuccess(t *testing.T, err error, msg string) {
	t.Helper()
	if err != nil {
		t.Error("expected ", msg, ": ", err)
	}
}

// AssertError calls t.Error if err is nil.
func AssertError(t *testing.T, err error, msg string) {
	t.Helper()
	if err == nil {
		t.Error("expected ", msg, ", got no error")
	}
}

func AssertErrorIs(t *testing.T, err error, matches error) {
	t.Helper()
	if !errors.Is(err, matches) {
		t.Error("expected error to be ", matches, " got ", err)
	}
}

// AssertEqual calls t.Error if `!reflect.DeepEqual(expected, got)`.
func AssertEqual(t *testing.T, expected interface{}, got interface{}) {
	t.Helper()
	if !reflect.DeepEqual(expected, got) {
		t.Errorf("expected %v, got %v", expected, got)
	}
}

// AssertIntsEqual asserts two `[]int`s are equal.
func AssertIntsEqual(t *testing.T, expected []int, got []int) {
	t.Helper()
	if len(expected) != len(got) {
		t.Errorf("missing lenghts: %v != %v: expected %v, got %v",
			len(expected), len(got), expected, got,
		)
		return
	}
	for i, val := range expected {
		if val != got[i] {
			t.Errorf("at index %v: expected %v, got %v", i, expected, got)
			return
		}
	}
}

// AssertIntIntsEqual asserts two `[][]int`s are equal.
func AssertIntIntsEqual(t *testing.T, expected [][]int, got [][]int) {
	t.Helper()
	if len(expected) != len(got) {
		t.Errorf("missing top level lengths: %v != %v: expected %v, got %v",
			len(expected), len(got), expected, got,
		)
		return
	}
	for i, expArray := range expected {
		gotArray := got[i]
		if len(expArray) != len(gotArray) {
			t.Errorf("length mismatch at index %v: %v != %v: expected %v, got %v",
				i, len(expArray), len(got), expected, got,
			)
			return
		}
		for j, val := range expArray {
			if val != gotArray[j] {
				t.Errorf("at index [%v, %v]: expected %v, got %v", i, j, expected, got)
			}
			return
		}
	}
}

func RunParallel(t *testing.T, name string, test func(t *testing.T)) {
	t.Run(name, func(t *testing.T) {
		t.Parallel()
		test(t)
	})
}
