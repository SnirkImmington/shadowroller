package config

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strconv"
	"strings"
)

var (
	// IsProduction toggles a variety of safety checks, logs, and the deployment of
	// an HTTPS server. **Set this to true if exposing yourself to the internet.**
	IsProduction = readBool("IS_PRODUCTION", false)

	// Debugging flags

	// CORSDebug toggles debugging from the github/rs/cors library.
	CORSDebug = readBool("CORS_DEBUG", false)

	// RedisDebug toggles logging every Redis command.
	RedisDebug = readBool("REDIS_DEBUG", false)

	// SlowResponsesDebug adds 5s to each response handler for debugging purposes.
	// This value is ignored on production.
	SlowResponsesDebug = readBool("SLOW_RESPONSES_DEBUG", false)

	// Go Server Configuration
	//
	// Shadowroller's API can run on either an HTTP or HTTPS server (both cannot
	// be set). An HTTP redirect server which redirects requests to HTTPS can be
	// run. If you are running on production behind a SSL-terminating reverse
	// proxy, you will need to set ReverseProxied to true. Otherwise, all options
	// are available in non-production environments.

	// PublishHTTPS sets a port at which an HTTPS server will run the REST API.
	// Alternatively, an HTTP server may be used (in development or if proxied).
	// This is required on production if ReverseProxied is not set.
	PublishHTTPS = readString("PUBLISH_HTTPS", "")
	// PublishRedirect sets a port at which a server will run an HTTP->HTTPS
	// redirect server (giving a 307 response to HTTP requests).
	PublishRedirect = readString("PUBLISH_REDIRECT", "")
	// PublishHTTP sets a port at which an HTTP server will run the REST API.
	// Alternatively, an HTTPS server may be used.
	// If used on production, ReverseProxied must be set to true.
	PublishHTTP = readString("PUBLISH_HTTP", ":3001")
	// ClientIPHeader sets a header to use for client IP addresses instead
	// of just using the request's RemoteAddr. If the header is not found,
	// RemoteAddr is used.
	ClientIPHeader = readString("CLIENT_IP_HEADER", "")
	// LogExtraHeaders allows for more headers to be logged with each request
	LogExtraHeaders = readStringArray("LOG_EXTRA_HEADERS", "")
	// ReverseProxied must be set to true if an HTTP API server is used on
	// production. It is ignored otherwise.
	ReverseProxied = readBool("REVERSE_PROXIED", false)

	// TLS configuration (if PublishHTTPS is set)
	//
	// TLS can be provided from one of two methods: Let's Encrypt or pem&key files.
	// Let's Encrypt is suggested for production use if you don't have certs from
	// another source.
	// If you want to use a non-HTTP challenge system for LE, either set this up
	// using an external system to update your pem&key files, or submit an issue
	// or pull request.

	// TLSHostname is the domain name of the server, used for HTTP redirects and
	// HTTPS configuration.
	// This must be set if PublishHTTPS is used.
	TLSHostname = readString("TLS_HOSTNAME", "localhost")
	// TLSAutocertDir is the directory where Let's Encrypt certificates are kept.
	TLSAutocertDir = readString("TLS_AUTOCERT_CERT_DIR", "")
	// TLSCertFiles is a list of the file names for the pem, private key cert files.
	TLSCertFiles = readStringArray("TLS_CERT_FILES", "")

	// Frontend Configuration
	// These options allow the frontend to be deployed on a separate server or
	// domain from the server. These values are used locally and in production.

	// FrontendDomain is the origin domain of the frontend, used for CORS requests.
	FrontendDomain = readString("FRONTEND_DOMAIN", "http://localhost:3000")
	// FrontendAddress is the redirect address that / should redirect to.
	// This is a full URL, useful for i.e. Github project sites.
	// If unset, the root URL will not redirect.
	FrontendAddress = readString("FRONTEND_ADDRESS", FrontendDomain)

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
	SSEClientRetrySecs = readInt("SSE_CLIENT_RETRY_SECS", 5)
	// SSEPingSecs is the amount of time between SSE pings.
	// Lack of SSE pings may cause the browser to close the SSE connection.
	SSEPingSecs = readInt("SSE_PING_SECS", 15)
	// MaxHeaderBytes is the maximum number of header bytes which can be read by
	// the Go server.
	MaxHeaderBytes = readInt("MAX_HEADER_BYTES", 1<<20)
	// MaxRequestsPer10Secs is a per-address rate limit for all endpoints.
	// For details, see `middleware.go`.
	MaxRequestsPer10Secs = readInt("MAX_REQUESTS_PER_10SECS", 16)

	// TempSessionTTLSecs is the amount of time a temporary session is stored
	// in redis after the subscription disconnects.
	TempSessionTTLSecs = readInt("TEMP_SESSION_TTL_SECS", 15*60)
	// PersistSessionTTLDays is the amount of time persistent sessions last.
	PersistSessionTTLDays = readInt("PERSIST_SESSION_TTL_DAYS", 30)

	// Library Options

	// RedisURL is the URI used to dial redis.
	RedisURL = readString("REDIS_URL", "redis://:6379")
	// RedisRetries controls the number of times a retry is attempted for some retryable
	// redis queries.
	RedisRetries = readInt("REDIS_RETRIES", 5)

	// Backend options

	// HealthCheckSecretKey allows for sending debug info with health checks.
	// If the contents of this key are passed to /health-check, debug info is sent.
	// This is always done in development. Leave blank to disable in production.
	HealthCheckSecretKey = readKeyFile("KEYFILE_HEALTHCHECK", "")

	// EnableTasks enables the /task route, which includes administrative commands.
	// It is recommended you run a separate sr-server instance with this enabled to
	// perform administrative tasks.
	EnableTasks = readBool("ENABLE_TASKS", false)
	// TasksLocalhostOnly enables the localhost filter on the tasks route.
	// Don't use this to conceal /task from the internet! Shadowroller cannot guarantee
	// you won't receive a request pretending to be from localhost.
	TasksLocalhostOnly = readBool("TASKS_LOCALHOST_ONLY", true)

	// HardcodedGameNames is a comma-separated list of GameIDs which the server
	// creates on startup.
	HardcodedGameNames = readStringArray("GAME_NAMES", "test1,test2")
	// HarcodedUsernames is a comma-separated list of usernames which the
	// server creates on startup.
	HardcodedUsernames = readStringArray("USERNAMES", "snirk,smark,smirk")
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

func readStringArray(name string, defaultValue string) []string {
	val, ok := os.LookupEnv("SR_" + name)
	if ok {
		log.Print("config: read env string array SR_", name)
	} else {
		val = defaultValue
	}
	if val == "" {
		return []string{}
	}
	return strings.Split(val, ",")
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
		// Allow for a trailing newline in the file
		contents = strings.TrimSpace(string(fileContent))
	}
	if contents == "" {
		log.Print("config: empty key ", name, " used!")
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
		if SlowResponsesDebug {
			log.Print("Config normalization: set SlowResponsesDebug = false")
			SlowResponsesDebug = false
		}
		if PublishHTTP != "" && !ReverseProxied {
			panic("Must set ReverseProxied if using an HTTP server on production")
		}
		if TLSHostname == "localhost" {
			log.Print("Warning: TLSHostname set to localhost on production")
		}
		if len(HealthCheckSecretKey) != 0 && len(HealthCheckSecretKey) < 256 {
			panic("HealthcheckSecretKey should be longer")
		}
	} else {
		if !EnableTasks {
			EnableTasks = true
		}
	}
	if PublishRedirect == PublishHTTPS && PublishHTTPS != "" {
		panic("Cannot publish HTTP redirect and HTTPS servers on the same port!")
	}
	if (PublishHTTP == "") == (PublishHTTPS == "") {
		panic("Must set one of PublishHTTP and PublishHTTPS!")
	}
	if PublishRedirect != "" {
		if PublishHTTP == PublishRedirect {
			panic("Cannot publish HTTP server and redirect server on the same port!")
		} else if PublishHTTP != "" {
			log.Print("Warning: publishing HTTP server and HTTP redirect server.")
		}
	}
	if PublishHTTPS != "" && ((TLSAutocertDir == "") == (len(TLSCertFiles) == 0)) {
		panic("Must set one of TLSAutocertDir and TLSCertFiles!")
	}
}
