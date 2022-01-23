package config

import (
	"fmt"
	goLog "log"
	"os"
	"strconv"
)

// Interface

type Value interface {
	Name() string
	ParseEnv(given string)
	// ParseFlag
}

type value struct {
	name   string
	config *Config
}

func (v *value) Name() string {
	return v.name
}

//
// String
//

type String interface {
	Value
	Get() string
	Default() string
	Set(newVal string)
}

type stringValue struct {
	value
	defaultVal string
	val        string
}

func (v *stringValue) ParseEnv(env string) {
	val, ok := os.LookupEnv("SR_" + v.name)
	if !ok {
		return
	}
	v.val = val
	goLog.Printf("config: set string SR_%v from env", v.name)
}

func (v *stringValue) Get() string {
	return v.val
}

func (v *stringValue) Default() string {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to get default value of config string %v", v.name))
	}
	return v.defaultVal
}

func (v *stringValue) Set(newValue string) {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to reassign config string %v", v.name))
	}
	v.val = newValue
}

func stringVar(c *Config, name string, defaultValue string) String {
	return &stringValue{
		value: value{
			name:   name,
			config: c,
		},
		defaultVal: defaultValue,
		val:        defaultValue,
	}
}

//
// Bool
//

type Bool interface {
	Value
	Get() bool
	Default() bool
	Set(newVal bool)
}

type boolValue struct {
	value
	defaultVal bool
	val        bool
}

func (v *boolValue) ParseEnv(env string) {
	valText, ok := os.LookupEnv("SR_" + v.name)
	if !ok {
		return
	}
	val, err := strconv.ParseBool(valText)
	if err != nil {
		panic("config: unable to parse bool SR_" + v.name + " from env: " + err.Error())
	}
	v.val = val
	goLog.Printf("config: set bool SR_%v from env", v.name)
}

func (v *boolValue) Get() bool {
	return v.val
}

func (v *boolValue) Default() bool {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to get default value of config bool %v", v.name))
	}
	return v.defaultVal
}

func (v *boolValue) Set(newValue bool) {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to reassign config bool %v", v.name))
	}
	v.val = newValue
}

func boolVar(c *Config, name string, defaultValue bool) Bool {
	return &boolValue{
		value: value{
			name:   name,
			config: c,
		},
		defaultVal: defaultValue,
		val:        defaultValue,
	}
}

//
// Int
//

type Int interface {
	Value
	Get() int
	Default() int
	Set(newVal int)
}

type intValue struct {
	value
	defaultVal int
	val        int
}

func (v *intValue) ParseEnv(env string) {
	valText, ok := os.LookupEnv("SR_" + v.name)
	if !ok {
		return
	}
	val, err := strconv.Atoi(valText)
	if err != nil {
		panic("config: unable to parse int SR_" + v.name + " from env: " + err.Error())
	}
	v.val = val
	goLog.Printf("config: set string SR_%v from env", v.name)
}

func (v *intValue) Get() int {
	return v.val
}

func (v *intValue) Default() int {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to get default value of config int %v", v.name))
	}
	return v.defaultVal
}

func (v *intValue) Set(newValue int) {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to reassign config int %v", v.name))
	}
	v.val = newValue
}

func intVar(c *Config, name string, defaultValue int) Int {
	return &intValue{
		value: value{
			name:   name,
			config: c,
		},
		defaultVal: defaultValue,
		val:        defaultValue,
	}
}
