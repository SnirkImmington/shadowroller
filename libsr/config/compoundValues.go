package config

import (
	"fmt"
	goLog "log"
	"net/url"
	"os"
	"regexp"
	"time"
)

var commaMatch = regexp.MustCompile(`[^\\],`)

//
// String array
//

type StringArray interface {
	Value
	Get() []string
	Default() []string
	Set(newVal []string)
}

type stringsValue struct {
	value
	defaultVal []string
	val        []string
}

func parseStrings(input string) []string {
	var result []string
	if input == "" {
		return result
	}
	start := 0
	end := 0
	for _, match := range commaMatch.FindAllStringIndex(input, -1) {
		// We're grabbing the entry that comes before the comma.
		// The regex will match the character prior to the coma as well, so we
		// only care about the end of the match (the actual comma).
		end = match[1]
		result = append(result, input[start:end-1])
		start = end
	}
	// We're looking for the commas so the last bit of the strong is done
	// outside of the loop. If there are no commas, this grabs the whole input
	// as one entry in the list.
	result = append(result, input[end:])

	return result
}

func (v *stringsValue) ParseEnv(env string) {
	valText, ok := os.LookupEnv("SR_" + v.name)
	if !ok {
		return
	}
	v.val = parseStrings(valText)
	goLog.Printf("config: set strings SR_%v from env", v.name)
}

func (v *stringsValue) Get() []string {
	return v.val
}

func (v *stringsValue) Default() []string {
	return v.defaultVal
}

func (v *stringsValue) Set(newValue []string) {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to reassign config strings %v", v.name))
	}
	v.val = newValue
}

func stringArrayVar(c *Config, name string, defaultValue string) StringArray {
	val := parseStrings(defaultValue)
	return &stringsValue{
		value: value{
			name:   name,
			config: c,
		},
		defaultVal: val,
		val:        val,
	}
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
