package test

import (
	"errors"
	mathRand "math/rand"
	"reflect"
	"sync"
	"testing"
	"time"

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

// MockTime returns a getter and setter function that operate on the same
// mocked time. The getter function can be passed to a stream listener to provide
// its time.Now and the setter can be used to advance or reverse that time.
func MockTime(start time.Time) (func() time.Time, func(time.Time)) {
	val := start
	set := func(newVal time.Time) {
		val = newVal
	}
	get := func() time.Time { return val }
	return get, set
}

// MockNow returns a mocked time along with getter and setter functions that
// operate on an internal value. The getter function can be passed to a stream
// listener ot provide its time.Now and the setter can be used to advance or
// reverse that time.
func MockNow() (time.Time, func() time.Time, func(time.Time)) {
	now := time.Now()
	get, set := MockTime(now)
	return now, get, set
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

// WaitForMessage starts a goroutine that checks for a message from messages which matches the expected value.
// This should be called before a function which publishes a message, and the return value's `.Wait()` should
// be called afterwards to ensure the AssertEqual or Error has been called on t.
func WaitForMessage(t *testing.T, messages <-chan miniredis.PubsubMessage, match string) *sync.WaitGroup {
	var wait sync.WaitGroup
	wait.Add(1)
	go func() {
		defer wait.Done()
		select {
		case msg := <-messages:
			AssertEqual(t, match, msg.Message)
		case <-time.After(time.Duration(5) * time.Second):
			t.Error("Did not read update")
		}
	}()

	return &wait
}
