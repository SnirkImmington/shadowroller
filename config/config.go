package config

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"os"
	"strconv"
)

var (
	// IsProduction toggles a variety of safety checks, logs, and the deployment of
	// an HTTPS server. **Set this to true if exposing yourself to the internet.**
	IsProduction = readBool("IS_PRODUCTION", false)

	// Server configs

	// ServerAddress is the address the non-production server binds to.
	// Set this to `localhost:port` to prevent publishing the server outside of
	// loopback/127.0.0.1. This publishing is required using Docker, or if you
	// want to access shadowroller from another device on the LAN.
	// This value is ignored in production.
	ServerAddress = readString("SERVER_ADDRESS", ":3001")
	// ServerHTTPPort is the port the production server uses for the "http redirect"
	// server.
	// It is configurable to allow sr-server to be run unpriveledged behind a
	// load balancer or port forwarding mechanism.
	// This value is ignored in production.
	ServerHTTPPort = readString("SERVER_HTTP_PORT", ":80")
	// ServerHTTPSPort is the port the production server uses for the main API server.
	// It is configurable to allow sr-server to be run unpriveledged behind a
	// load balancer or port forwarding mechanism.
	// This value is ignored in production.
	ServerHTTPSPort = readString("SERVER_HTTPS_PORT", ":443")
	// FrontendAddress is used to redirect users from "/" to a domain from where the
	// frontend HTTPS is served.
	// In production, this is used as the CORS origin.
	FrontendAddress = readString("FRONTEND_ADDRESS", "http://localhost:3000")

	// Security values

	// CORSDebug toggles debugging from the github/rs/cors library.
	CORSDebug = readBool("CORS_DEBUG", false)
	// JWTSecretKey is the secure key/key file used to encrypt JWT auth tokens.
	JWTSecretKey = readKeyFile("KEYFILE_JWT", "133713371337")
	// AuthCookieMaxAge is the "Max-Age" field on JWT auth token cookies.
	AuthCookieMaxAge = readInt("COOKIE_MAX_AGE", 2592000) // 30 days

	// TLS configs

	// TLSEnable toggles whether TLS is used for the server.
	TlsEnable = readBool("TLS_ENABLE", false)
	// TLSHost is the domain name of the server.
	TlsHost = readString("TLS_HOST", "https://shadowroller.immington.industries")
	// CertDir is the directory where Let's Encrypt certificates are kept.
	CertDir = readString("CERT_DIR", "/var/sr-server/cert/")

	// Timeouts

	// ReadTimeoutSecs is the timeout of the http server's request readers.
	ReadTimeoutSecs = readInt("READ_TIMEOUT_SECS", 30)
	// WriteTimeoutSecs is **unused** due to a known limit in Go's HTTP server.
	WriteTimeoutSecs = readInt("WRITE_TIMEOUT_SECS", 30)
	// IdleTimeout is the time an http connection can remain idle.
	IdleTimeoutSecs = readInt("IDLE_TIMEOUT_SECS", 60)
	// I'd like to have write timeouts, but those are infamously set globally for the
	// server. The ResponseWriters we get can't set individual timeouts, so we can't
	// have write timeouts for regular requests AND sse.
	//SSEWriteTimeoutSecs = readInt("SSE_WRITE_TIMEOUT_SECS", 30)
	// SSEClientRetrySecs is the amount of time suggested to an SSE client to
	// wait between reconnects.
	SSEClientRetrySecs = readInt("SSE_CLIENT_RETRY_SECS", 5)
	// SSEPingSecs is the amount of time between SSE pings.
	// Lack of SSE pings may cause the browser to close the SSE connection.
	SSEPingSecs = readInt("SSE_PING_SECS", 20)
	// MaxHeaderBytes is the maximum number of header bytes which can be read by
	// the Go server.
	MaxHeaderBytes = readInt("MAX_HEADER_BYTES", 1<<20)
	// MaxRequestsPer10Secs is a per-address rate limit for all endpoints.
	// For details, see `middleware.go`.
	MaxRequestsPer10Secs = readInt("MAX_REQUESTS_PER_10SECS", 20)

	// Library Options

	// RedisUrl is the URI used to dial redis.
	RedisUrl = readString("REDIS_URL", "redis://:6379")

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
	return val
}

func readInt(name string, defaultValue int) int {
	envVal, ok := os.LookupEnv("SR_" + name)
	if !ok {
		return defaultValue
	}
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
	val, err := base64.StdEncoding.DecodeString(contents)
	if err != nil {
		panic(fmt.Sprintf("Unable to decode key %v: %v", name, err))
	}
	return val
}

func VerifyConfig() {
	if IsProduction && !TlsEnable {
		panic("Invalid config: TLS not set in production")
	}
}
