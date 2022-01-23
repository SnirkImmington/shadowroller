package config

import (
	"fmt"
	goLog "log"
	"net/url"
	"os"
	"time"
)

//
// String array
//

type StringArray interface {
	Value
	Get() []string
	Default() []string
	Set(newVal []string)
}

//
// Duration
//

type Dur interface {
	Value
	Get() time.Duration
	Default() time.Duration
	Set(newVal time.Duration)
}

type durValue struct {
	value
	defaultVal time.Duration
	val        time.Duration
}

func (v *durValue) ParseEnv(env string) {
	valText, ok := os.LookupEnv("SR_" + v.name)
	if !ok {
		return
	}
	val, err := time.ParseDuration(valText)
	if err != nil {
		panic("config: unable to parse dur SR_" + v.name + " from env: " + err.Error())
	}
	v.val = val
	goLog.Printf("config: set dur SR_%v from env", v.name)
}

func (v *durValue) Get() time.Duration {
	return v.val
}

func (v *durValue) Default() time.Duration {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to get default value of config duration %v", v.name))
	}
	return v.defaultVal
}

func (v *durValue) Set(newValue time.Duration) {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to reassign config dur %v", v.name))
	}
	v.val = newValue
}

func durVar(c *Config, name string, defaultValue time.Duration) Dur {
	return &durValue{
		value: value{
			name:   name,
			config: c,
		},
		defaultVal: defaultValue,
		val:        defaultValue,
	}
}

//
// URL
//

type URL interface {
	Value
	Get() *url.URL
	Default() *url.URL
	Set(newVal *url.URL)
}

type urlValue struct {
	value
	defaultVal *url.URL
	val        *url.URL
}

func (v *urlValue) ParseEnv(env string) {
	valText, ok := os.LookupEnv("SR_" + v.name)
	if !ok {
		return
	}
	val, err := url.Parse(valText)
	if err != nil {
		panic("config: unable to parse url SR_" + v.name + " from env: " + err.Error())
	}
	v.val = val
	goLog.Printf("config: set url SR_%v from env", v.name)
}

func (v *urlValue) Get() *url.URL {
	return v.val
}

func (v *urlValue) Default() *url.URL {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to get default value of config url %v", v.name))
	}
	return v.defaultVal
}

func (v *urlValue) Set(newValue *url.URL) {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to reassign config url %v", v.name))
	}
	v.val = newValue
}

func urlVar(c *Config, name string, defaultValue string) URL {
	defaultParsed, err := url.Parse(defaultValue)
	if err != nil {
		panic("config: unable to parse declaration for config url " + name)
	}
	return &urlValue{
		value: value{
			name:   name,
			config: c,
		},
		defaultVal: defaultParsed,
		val:        defaultParsed,
	}
}
