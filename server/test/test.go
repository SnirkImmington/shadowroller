package test

import (
	"testing"
	"reflect"
)

func Assert(t *testing.T, cond bool, msg string, expected interface{}, got interface{}) {
	t.Helper()
	if !cond {
		t.Errorf(msg + ": expected %v, got %v", expected, got)
	}
}

func AssertSuccess(t *testing.T, err error, msg string) {
	t.Helper()
	if err != nil {
		t.Error(msg, ": ", err)
	}
}

func AssertEqual(t *testing.T, expected interface{}, got interface{}) {
	t.Helper()
	if !reflect.DeepEqual(expected, got) {
		t.Errorf("expected %v, got %v", expected, got)
	}
}

func AssertIntsEqual(t *testing.T, expected []int, got []int) {
	t.Helper()
	equal := true
	badIndex := 0
	if len(expected) != len(got) {
		t.Errorf("missing lenghts: %v != %v: expected %v, got %v",
			len(expected), len(got), expected, got,
		)
	}
	if !equal {
		for i, val := range expected {
			if val != got[i] {
				equal = false
				badIndex = i
				break
			}
		}
	}
	if !equal {
		t.Errorf("at index %v: expected %v, got %v", badIndex, expected, got)
	}
}
