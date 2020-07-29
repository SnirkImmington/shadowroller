package config

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strconv"
)

var (
	// IsProduction toggles a variety of safety checks, logs, and the deployment of
	// an HTTPS server. **Set this to true if exposing yourself to the internet.**
	IsProduction = readBool("IS_PRODUCTION", false)

	// CORSDebug toggles debugging from the github/rs/cors library.
	CORSDebug = readBool("CORS_DEBUG", false)

	// RedisDebug toggles logging every Redis command.
	RedisDebug = readBool("REDIS_DEBUG", false)

	// SlowResponsesDebug adds 5s to each response handler for debugging purposes.
	// This value is ignored on production.
	SlowResponsesDebug = readBool("SLOW_RESPONSES_DEBUG", false)

	// Go Server Configuration
	// The dev server/prod server/redirect server can be configured to run on
	// different ports, so the server can run non-root behind a reverse proxy or
	// load balancer.

	// HostAddress is the address the non-production server binds to.
	// Set this to `localhost:port` to prevent publishing the server outside of
	// loopback/127.0.0.1. This publishing is required using Docker, or if you
	// want to access shadowroller from another device on the LAN.
	// This value is ignored in production.
	HostAddress = readString("HOST_ADDRESS", ":3001")
	// HostHTTP is the port the production server uses for the "http redirect"
	// server.
	// It is configurable to allow sr-server to be run unpriveledged behind a
	// load balancer or port forwarding mechanism.
	// This value is ignored in production.
	HostHTTP = readString("HOST_HTTP", ":80")
	// HostHTTPS is the port the production server uses for the main API server.
	// It is configurable to allow sr-server to be run unpriveledged behind a
	// load balancer or port forwarding mechanism.
	// This value is ignored in production.
	HostHTTPS = readString("HOST_HTTPS", ":443")
	// FrontendDomain is the origin domain of the frontend, used for CORS requests
	FrontendDomain = readString("FRONTEND_DOMAIN", "http://localhost:3000")
	// FrontendAddress is the redirect address that / should redirect to.
	FrontendAddress = readString("FRONTEND_ADDRESS", FrontendDomain)

	// Keys
	// In development, these are hardcoded to known values for testing.
	// In production, these must point to keyfiles containing base64 encoded keys.

	// JWTSecretKey is the secure key/key file used to encrypt JWT auth tokens.
	JWTSecretKey = readKeyFile("KEYFILE_JWT", "133713371337")
	// HealthCheckSecretKey allows for sending debug info with health checks.
	// If the contents of this key are passed to /health-check, debug info is sent.
	// This is always done in development. Leave blank to disable in production.
	HealthCheckSecretKey = readKeyFile("KEYFILE_HEALTHCHECK", "")

	// Authentication config

	// TLS configuration

	// TLSEnable toggles whether TLS is used for non-production server.
	// (It is set to true when in production.)
	TLSEnable = readBool("TLS_ENABLE", false)
	// TLSHostname is the domain name of the server.
	TLSHostname = readString("TLS_HOSTNAME", "shadowroller.immington.industries")
	// CertDir is the directory where Let's Encrypt certificates are kept.
	CertDir = readString("CERT_DIR", "/var/sr-server/cert/")

	// Timeouts

	// ReadTimeoutSecs is the timeout of the http server's request readers.
	ReadTimeoutSecs = readInt("READ_TIMEOUT_SECS", 30)
	// WriteTimeoutSecs is **unused** due to a known limit in Go's HTTP server.
	WriteTimeoutSecs = readInt("WRITE_TIMEOUT_SECS", 30)
	// IdleTimeoutSecs is the time an http connection can remain idle.
	IdleTimeoutSecs = readInt("IDLE_TIMEOUT_SECS", 60)
	// I'd like to have write timeouts, but those are infamously set globally for the
	// server. The ResponseWriters we get can't set individual timeouts, so we can't
	// have write timeouts for regular requests AND sse.
	//SSEWriteTimeoutSecs = readInt("SSE_WRITE_TIMEOUT_SECS", 30)

	// SSEClientRetrySecs is the amount of time suggested to an SSE client to
	// wait between reconnects.
	SSEClientRetrySecs = readInt("SSE_CLIENT_RETRY_SECS", 15)
	// SSEPingSecs is the amount of time between SSE pings.
	// Lack of SSE pings may cause the browser to close the SSE connection.
	SSEPingSecs = readInt("SSE_PING_SECS", 20)
	// MaxHeaderBytes is the maximum number of header bytes which can be read by
	// the Go server.
	MaxHeaderBytes = readInt("MAX_HEADER_BYTES", 1<<20)
	// MaxRequestsPer10Secs is a per-address rate limit for all endpoints.
	// For details, see `middleware.go`.
	MaxRequestsPer10Secs = readInt("MAX_REQUESTS_PER_10SECS", 16)

	// TempSessionTTLSecs is the amount of time a temporary session is stored
	// in redis after the subscription disconnects.
	TempSessionTTLSecs = readInt("TEMP_SESSION_TTL_SECS", 15*60)
	/// PersistSessionTTLDays is the amount of time persistent sessions last.
	PersistSessionTTLDays = readInt("PERSIST_SESSION_TTL_DAYS", 30)

	// Library Options

	// RedisURL is the URI used to dial redis.
	RedisURL = readString("REDIS_URL", "redis://:6379")

	// Backend options

	// HardcodedGameNames is a comma-separated list of GameIDs which the server
	// creates on startup.
	HardcodedGameNames = readString("GAME_NAMES", "test1,test2")
	// RollBufferSize is the size of the channel buffer from the roll goroutine.
	RollBufferSize = readInt("ROLL_BUFFER_SIZE", 200)
	// MaxSingleRoll is the largest roll request the server will handle at once.
	MaxSingleRoll = readInt("MAX_SINGLE_ROLL", 100)
	// MaxEventRange is the largest range of events the server will provide at once.
	MaxEventRange = readInt("MAX_EVENT_RANGE", 50)
)

func readString(name string, defaultValue string) string {
	val, ok := os.LookupEnv("SR_" + name)
	if !ok {
		return defaultValue
	}
	log.Print("config: read env string SR_", name)
	return val
}

func readInt(name string, defaultValue int) int {
	envVal, ok := os.LookupEnv("SR_" + name)
	if !ok {
		return defaultValue
	}
	log.Print("config: read env int SR_", name)
	val, err := strconv.Atoi(envVal)
	if err != nil {
		panic("Unable to read " + name + ": " + envVal)
	}
	return val
}

func readBool(name string, defaultValue bool) bool {
	envVal, ok := os.LookupEnv("SR_" + name)
	if !ok {
		return defaultValue
	}
	log.Print("config: read env bool SR_", name)
	val, err := strconv.ParseBool(envVal)
	if err != nil {
		panic("Unable to read " + name + ": " + envVal)
	}
	return val
}

func readKeyFile(name string, defaultValue string) []byte {
	envVal, ok := os.LookupEnv("SR_" + name)
	var contents string
	if !ok {
		contents = defaultValue
	} else {
		fileContent, err := ioutil.ReadFile(envVal)
		if err != nil {
			panic(fmt.Sprintf("Unable to read key %v from file %v: %v", name, envVal, err))
		}
		contents = string(fileContent)
	}
	if contents == "" {
		return []byte(contents)
	}
	val, err := base64.StdEncoding.DecodeString(contents)
	if err != nil {
		panic(fmt.Sprintf("Unable to decode key %v: %v", name, err))
	}
	return val
}

// VerifyConfig performs sanity checks and normalizes config settings.
func VerifyConfig() {
	if IsProduction {
		if !TLSEnable {
			log.Print("Config normalization: Overriding TLSEnable")
			TLSEnable = true
		}
		if SlowResponsesDebug {
			log.Print("Config normalization: Overriding SlowResponsesDebug")
			SlowResponsesDebug = false
		}
	}
	if len(JWTSecretKey) == 0 {
		panic("No JWT key given!")
	}
}
