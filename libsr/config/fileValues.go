package config

import (
	"fmt"
	goLog "log"
	"os"
	"strings"
)

//
// File (satisfies String interface)

type fileValue struct {
	value
	defaultPath string
	defaultVal  string
	val         string
}

func (v *fileValue) ParseEnv(env string) {
	path := v.defaultPath
	if envPath, ok := os.LookupEnv("SR_" + v.name); ok {
		goLog.Printf("config: set path for SR_%v from env", v.name)
		path = envPath
	}
	fileContent, err := os.ReadFile(path)
	if err != nil {
		if v.config.IsProduction.Get() {
			panic("config: unable to read file for SR_" + v.name + " from env: " + err.Error())
		}
		goLog.Printf("config: unable to read file for SR_%v: %v", v.name, err)
		return
	}
	contents := strings.TrimSpace(string(fileContent))
	if contents == "" && v.config.IsProduction.Get() {
		panic("config: empty file provided for SR_%v" + v.name)
	}
	v.val = contents
	goLog.Printf("config: set file content SR_%v from env", v.name)
}

func (v *fileValue) Get() string {
	return v.val
}

func (v *fileValue) Default() string {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to get default value of config key %v", v.name))
	}
	return v.defaultVal
}

func (v *fileValue) Set(newVal string) {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to reassign config key %v", v.name))
	}
	v.val = newVal
}

func fileVar(c *Config, name string, defaultPath string, defaultVal string) String {
	return &fileValue{
		value: value{
			name:   name,
			config: c,
		},
		defaultPath: defaultPath,
		defaultVal:  defaultVal,
		val:         defaultVal,
	}
}

//
// Key - byte arrays with base64 encoding
//

type Key interface {
	Value
	Get() []byte
	Set(newVal []byte)
}

type keyValue struct {
	value
	defaultPath string
	defaultVal  []byte
	val         []byte
}

func (v *keyValue) ParseEnv(env string) {
	path := v.defaultPath
	if envPath, ok := os.LookupEnv("SR_" + v.name); ok {
		goLog.Printf("config: set key SR_%v from env", v.name)
		path = envPath
	}
	fileContent, err := os.ReadFile(path)
	if err != nil {
		if v.name != "KEYFILE_HEALTHCHECK" && v.config.IsProduction.Get() {
			panic("config: unable to read file for SR_" + v.name + " from env: " + err.Error())
		}
		goLog.Printf("config: unable to read keyfile SR_%v: %v", v.name, err)
	}
	contents := strings.TrimSpace(string(fileContent))
	if contents == "" {
		v.val = []byte{}
		if v.name == "KEYFILE_HEALTHCHECK" {
			goLog.Printf("config: empty keyfile for SR_%v", v.name)
		} else if v.config.IsProduction.Get() {
			panic("config: empty keyfile provided for SR_%v" + v.name)
		}
		return
	}
	val, err := base64.StdEncoding.DecodeString(contents)
	if err != nil {
		panic("config: unable to decode keyfile SR_" + v.name + ": " + err.Error())
	}
	v.val = val
	goLog.Printf("config: set keyfile SR_%v from env", v.name)
}

func (v *keyValue) Get() []byte {
	return v.val
}

func (v *keyValue) Default() []byte {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to get default value of config key %v", v.name))
	}
	return v.defaultVal
}

func (v *keyValue) Set(newValue []byte) {
	if v.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to reassign config key %v", v.name))
	}
	v.val = newValue
}

func keyfileVar(c *Config, name string, defaultPath string, defaultVal []byte) Key {
	return &keyValue{
		value: value{
			name:   name,
			config: c,
		},
		defaultPath: defaultPath,
		defaultVal:  defaultVal,
		val:         defaultVal,
	}
}
