package redis

import (
	"sr/test"
	"testing"
)

type Basic struct {
	Name string
}

type WithRedisFlag struct {
	FieldOne string `notredis:"field1"`
	FieldTwo int    `redis:"field3"`
}

type AvailableKeys struct {
	Int8   int8
	Int16  int16
	Int32  int32
	Int64  int64
	Uint8  uint8
	Uint16 uint16
	Uint32 uint32
	Uint64 uint64
	Bool   bool
	String string
	Bytes  []byte
}

type AvailableKeysRedis struct {
	Int8   int8   `redis:"i8"`
	Int16  int16  `redis:"i16"`
	Int32  int32  `redis:"i32"`
	Int64  int64  `redis:"i64"`
	Uint8  uint8  `redis:"u8"`
	Uint16 uint16 `redis:"u16"`
	Uint32 uint32 `redis:"u32"`
	Uint64 uint64 `redis:"u64"`
	Bool   bool   `redis:"bool"`
	String string `redis:"str"`
	Bytes  []byte `redis:"bytes"`
}

type TooComplex struct {
	basic Basic
}

func TestInvalidTypes(t *testing.T) {
	t.Run("does not allow builtins", func(t *testing.T) {
		cases := []struct {
			input interface{}
			name  string
		}{
			{input: int64(2), name: "int64"},
			{input: int32(3), name: "int32"},
			{input: int16(4), name: "int16"},
			{input: int8(2), name: "int8"},
			{input: 2, name: "int"},
			{input: false, name: "bool"},
			{input: float64(0), name: "float64"},
			{input: float32(1), name: "float32"},
		}
		for _, c := range cases {
			_, err := StructToStringMap(&c.input)
			test.AssertError(t, err, c.name)
		}
	})

	t.Run("does not allow nil", func(t *testing.T) {
		_, err := StructToStringMap(nil)
		test.AssertError(t, err, "nil")
	})

	t.Run("does not allow collections", func(t *testing.T) {
		cases := []struct {
			input interface{}
			name  string
		}{
			{input: []int64{}, name: "[]int64"},
			{input: []bool([]bool{true}), name: "bool slice"},
			{input: map[string]string{"foo": "bar"}, name: "string map"},
		}
		for _, c := range cases {
			_, err := StructToStringMap(&c.input)
			test.AssertError(t, err, c.name)
		}
	})

	t.Run("does not allow non-pointed struct", func(t *testing.T) {
		input := Basic{Name: "hello"}
		_, err := StructToStringMap(input)
		test.AssertError(t, err, "non-pointer error")
	})

	t.Run("allows struct values", func(t *testing.T) {
		input := Basic{Name: "hello"}
		expected := map[string]string{
			"Name": "hello",
		}
		result, err := StructToStringMap(&input)
		test.AssertSuccess(t, err, "map created")
		test.AssertEqual(t, expected, result)
	})

	t.Run("follows just redis keys", func(t *testing.T) {
		input := WithRedisFlag{FieldOne: "hello", FieldTwo: 2}
		expected := map[string]string{
			"FieldOne": "hello",
			"field3":   "2",
		}
		result, err := StructToStringMap(&input)
		test.AssertSuccess(t, err, "map created")
		test.AssertEqual(t, expected, result)
	})

	t.Run("adds all element types", func(t *testing.T) {
		input := AvailableKeys{String: "foo", Bytes: []byte("bar")} // Just leave everything empty
		expect := map[string]string{
			"Int8": "0", "Int16": "0", "Int32": "0", "Int64": "0",
			"Uint8": "0", "Uint16": "0", "Uint32": "0", "Uint64": "0",
			"Bool": "false", "String": "foo", "Bytes": "bar",
		}
		result, err := StructToStringMap(&input)
		test.AssertSuccess(t, err, "map created")
		test.AssertEqual(t, expect, result)
	})

	t.Run("adds all named element types", func(t *testing.T) {
		input := AvailableKeysRedis{String: "foo", Bytes: []byte("bar")} // Just leave everything empty
		expect := map[string]string{
			"i8": "0", "i16": "0", "i32": "0", "i64": "0",
			"u8": "0", "u16": "0", "u32": "0", "u64": "0",
			"bool": "false", "str": "foo", "bytes": "bar",
		}
		result, err := StructToStringMap(&input)
		test.AssertSuccess(t, err, "map created")
		test.AssertEqual(t, expect, result)
	})

	t.Run("does not accept nested struct", func(t *testing.T) {
		type Advanced struct {
			Basic Basic
		}
		input := Advanced{Basic: Basic{Name: "hello"}}
		_, err := StructToStringMap(&input)
		test.AssertError(t, err, "invalid field")
	})

	t.Run("errors for unexposed fields", func(t *testing.T) {
		type private struct {
			Exposed bool
			private int
		}
		input := private{}
		_, err := StructToStringMap(&input)
		test.AssertError(t, err, "map created")
	})
}
