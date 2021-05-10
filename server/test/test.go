package test

import (
	"reflect"
	"testing"
)

// Assert calls t.ErrorF if cond is false.
func Assert(t *testing.T, cond bool, msg string, expected interface{}, got interface{}) {
	t.Helper()
	if !cond {
		t.Errorf(msg+": expected %v, got %v", expected, got)
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
