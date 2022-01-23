package config

import (
	"encoding/base64"
	"fmt"
	goLog "log"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

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

type String interface {
	Value
	Get() string
	Default() string
	Set(newVal string)
}

type Int interface {
	Value
	Get() int
	Default() int
	Set(newVal int)
}

type Bool interface {
	Value
	Get() bool
	Default() bool
	Set(newVal bool)
}

type Dur interface {
	Value
	Get() time.Duration
	Default() time.Duration
	Set(newVal time.Duration)
}

type StringArray interface {
	Value
	Get() []string
	Default() []string
	Set(newVal []string)
}

type URL interface {
	Value
	Get() *url.URL
	Default() *url.URL
	Set(newVal *url.URL)
}

type Key interface {
	Value
	Get() []byte
	Set(newVal []byte)
}

type stringValue struct {
	value
	defaultVal string
	val        string
}

func (s *stringValue) ParseEnv(env string) {
	val, ok := os.LookupEnv("SR_" + s.name)
	if !ok {
		return
	}
	s.val = val
	goLog.Printf("config: set string SR_%v from env", s.name)
}

func (s *stringValue) Get() string {
	return s.val
}

func (s *stringValue) Default() string {
	if s.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to get default value of config string %v", s.name))
	}
	return s.defaultVal
}

func (s *stringValue) Set(newValue string) {
	if s.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to reassign config string %v", s.name))
	}
	s.val = newValue
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

type intValue struct {
	value
	defaultVal int
	val        int
}

func (s *intValue) ParseEnv(env string) {
	valText, ok := os.LookupEnv("SR_" + s.name)
	if !ok {
		return
	}
	val, err := strconv.Atoi(valText)
	if err != nil {
		panic("config: unable to parse int SR_" + s.name + " from env: " + err.Error())
	}
	s.val = val
	goLog.Printf("config: set string SR_%v from env", s.name)
}

func (s *intValue) Get() int {
	return s.val
}

func (s *intValue) Default() int {
	if s.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to get default value of config int %v", s.name))
	}
	return s.defaultVal
}

func (s *intValue) Set(newValue int) {
	if s.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to reassign config int %v", s.name))
	}
	s.val = newValue
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

type boolValue struct {
	value
	defaultVal bool
	val        bool
}

func (s *boolValue) ParseEnv(env string) {
	valText, ok := os.LookupEnv("SR_" + s.name)
	if !ok {
		return
	}
	val, err := strconv.ParseBool(valText)
	if err != nil {
		panic("config: unable to parse bool SR_" + s.name + " from env: " + err.Error())
	}
	s.val = val
	goLog.Printf("config: set bool SR_%v from env", s.name)
}

func (s *boolValue) Get() bool {
	return s.val
}

func (s *boolValue) Default() bool {
	if s.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to get default value of config bool %v", s.name))
	}
	return s.defaultVal
}

func (s *boolValue) Set(newValue bool) {
	if s.value.config.IsProduction.Get() {
		panic(fmt.Sprintf("attempt to reassign config bool %v", s.name))
	}
	s.val = newValue
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
