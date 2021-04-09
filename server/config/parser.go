package config

import (
	"strings"
	"fmt"
	"regexp"
	"flag"
	"strconv"
)

// Parser is the parser for the config
var Parser = parser{handlers: make(map[string]func(string) error)}

func configBool(val *bool, name string, initial bool, message string) int {
	flag.BoolVar(val, name, initial, message)
	Parser.Handle(name, func(configVal string) error {
		b, err := strconv.ParseBool(configVal)
		if err != nil {
			return err
		}
		*val = b
		flag.Lookup(name).DefValue = configVal
		return nil
	})
	return 0
}

func configString(val *string, name string, initial string, message string) int {
	flag.StringVar(val, name, initial, message)
	Parser.Handle(name, func(configVal string) error {
		*val = configVal
		flag.Lookup(name).DefValue = configVal
		return nil
	})
	return 0
}

func configInt(val *int, name string, initial int, message string) *struct{} {
	flag.IntVar(val, name, initial, message)
	Parser.Handle(name, func(configVal string) error {
		i, err := strconv.Atoi(configVal)
		if err != nil {
			return err
		}
		*val = i
		flag.Lookup(name).DefValue = configVal
		return nil
	})
	return nil
}

func configStringArray(val []string, name string, initial string, message string) *struct{} {
	flag.StringVar(val, name, initial, message)
	Parser.Handle(name, func(configVal string) error {
		i, err := strconv.Atoi(configVal)
		if err != nil {
			return err
		}
		*val = i
		flag.Lookup(name).DefValue = configVal
		return nil
	})
	return nil
}

// Parser receives handlers for config values when it parses a new config value
type parser struct {
	handlers map[string]func(string) error
}


// Handle registers a new value to the config parser
func (parser *parser) Handle(key string, handler func(string) error) {
	_, ok := parser.handlers[key]
	if ok {
		panic("Attempted to double-register handler for " + key)
	}
	parser.handlers[key] = handler
}

// ParseError is returned from config.Parse when there is an error
type ParseError struct {
	Message string
	Line int
	Col int
}

func (err *ParseError) Error() string {
	return fmt.Sprintf("%v:%v %v", err.Line, err.Col, err.Message)
}

// identMatch is a more conservative regex for identifiers.
// In the config, they're just the names of the corresponding variables,
// and follow Go's naming conventions.
var identMatch = regexp.MustCompile(
	`[a-z][a-zA-Z-]+`,
)

// Parse parses a "Go style" .conf file. This is a constrained version of
// .ini/.conf files that doesn't use equals signs.
//
// Here's an example config:
//
// # Comments begin with a hash
//
// # Blank lines are ignored
// # Format is `key value`
// val true # Comments at the end of lines
// # Values can be bool, int, float, or strings
// boolVal false
// intVal  12 # You can use extra spaces or tabs
// textVal this is some text
func (parser *parser) ParseConfigFile(config string) error {
	lines := strings.Split(config, "\n")
	for ix, srcLine := range lines {
		line := strings.Trim(srcLine, " \t\r")
		if len(line) == 0 {
			continue
		}
		if line[0] == '#' {
			continue
		}
		parts := strings.SplitN(line, " ", 2)
		if len(parts) != 2 {
			return &ParseError{
				Message: "Expected `key value`",
				Line: ix + 1,
				Col: 0,
			}
		}
		key := parts[0]
		rawVal := parts[1]
		val := strings.Trim(rawVal, " \t\r")

		if hashIndex := strings.IndexRune(key, '#'); hashIndex >= 0 {
			return &ParseError{
				Message: fmt.Sprintf("Invalid key %v: contains hash", key),
				Line: ix + 1,
				Col: hashIndex + 1,
			}
		}
		if !identMatch.MatchString(key) {
			return &ParseError{
				Message: fmt.Sprintf("Invalid key %v: not regular identifier", key),
				Line: ix + 1,
				Col: len(key) + 1,
			}
		}
		handler, found := parser.handlers[key]
		if !found {
			return &ParseError{
				Message: fmt.Sprintf("Unknown key %v", key),
				Line: ix + 1,
				Col: 1,
			}
		}

		hashIndex := strings.IndexRune(val, '#')
		if hashIndex >= 0 {
			val = strings.TrimSuffix(val[0 : hashIndex], " \t\r")
		}

		if result := handler(val); result != nil {
			return fmt.Errorf("%v:1 %v: %w", ix + 1, key, result)
		}
	}
	return nil
}

func (parser *parser) ParseArgs(args []string) {

}
