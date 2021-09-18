package redis

import (
	"errors"
	"fmt"
	"reflect"
)

var stringableKinds = []reflect.Kind{
	reflect.Bool,
	reflect.Float32, reflect.Float64,
	reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
	reflect.String,
	reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64,
}

var UnableToGetNames = errors.New("unable to find all fields in type")

func isStringable(kind reflect.Kind) bool {
	for _, valid := range stringableKinds {
		if kind == valid {
			return true
		}
	}
	return false
}

func collectFieldNames(ty reflect.Type) []string {
	var result []string
	ty.FieldByNameFunc(func(name string) bool {
		result = append(result, name)
		return false
	})
	return result
}

// StructToStringMap converts a struct to a string map.
func StructToStringMap(v interface{}) (map[string]string, error) {
	if v == nil {
		return nil, fmt.Errorf("StructToStringMap got nil")
	}
	ty := reflect.TypeOf(v)
	if ty.Kind() != reflect.Ptr || ty.Elem().Kind() != reflect.Struct {
		return nil, fmt.Errorf("type %v is not a reference to a struct", ty.Name())
	}
	ty = ty.Elem()
	val := reflect.ValueOf(v)
	val = val.Elem()
	result := make(map[string]string)
	for i := 0; i < ty.NumField(); i++ {
		field := ty.Field(i)
		name := field.Name
		if tagged, found := field.Tag.Lookup("redis"); found {
			if tagged == "-" {
				continue
			}
			name = tagged
		}
		kind := field.Type.Kind()
		if kind == reflect.Slice && field.Type.Elem().Kind() == reflect.Uint8 {
			fieldVal := val.Field(i)
			result[name] = string(fieldVal.Interface().([]byte))
			continue
		}
		if !isStringable(kind) {
			return nil, fmt.Errorf("field %v (%v) of %v cannot be converted to a string",
				field.Name, field.Type.Name(), ty.Name())
		}
		fieldVal := val.Field(i)
		if !fieldVal.CanInterface() {
			return nil, fmt.Errorf("field %v (%v) cannot be read",
				field.Name, field.Type.Name())
		}
		result[name] = fmt.Sprintf("%v", fieldVal.Interface())
	}
	return result, nil
}
