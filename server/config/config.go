package config

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"log" // Can't import SR log due to import cycle.
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/go-redis/redis/v8"
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

	// OtelDebug toggles logging of otel processes
	OtelDebug = readBool("OTEL_DEBUG", true)

	// RedisConnectionsDebug toggles logging when redis connections are obtained and freed.
	RedisConnectionsDebug = readBool("REDIS_CONNECTIONS", false)

	// ShutdownHandlersDebug toggles logging of shutdown handlers being registered and used.
	ShutdownHandlersDebug = readBool("SHUTDOWN_HANDLERS_DEBUG", false)

	// StreamDebug toggles extra logging for the SSE stream tasks
	StreamDebug = readBool("STREAM_DEBUG", false)

	// UpdatesDebug toggles extra logging for updates being created and sent
	UpdatesDebug = readBool("UDPATES_DEBUG", false)

	// SlowResponsesDebug adds 5s to each response handler for debugging purposes.
	// This value is ignored on production.
	SlowResponsesDebug = readBool("SLOW_RESPONSES_DEBUG", false)

	// Go Servers Configuration
	//
	// Shadowroller runs web servers for a few different functions:
	// - API: an API server that acts as the interface to the backend
	// - FRONTEND: a frontend server that hosts the code for the frontend (a subpath of API)
	// - REDIRECT: a redirect server that forwards HTTP requests to HTTPS
	//
	// The system used here is designed for some flexibility in a few environments:
	// development, as a do-it-all standalone server, and as the backend with separate
	// frontend hosting. However, the three components are not generally standalone servers.
	// Shadowroller is not written to only run the frontend server or run the frontend server
	// on a different port than the API server. If you need these features, please file an
	// issue or open a pull request.
	//
	// Local/Development:
	//
	// In development, the API server can run with no redirect, and the frontend should
	// run separately via Node. HTTPS may be used for the API if desired.
	// The default publish options are designed for this:
	// - MAIN_LISTEN_HTTP=<port> (3001 default)
	// - // alternatively, API_PUBLISH_HTTPS=<port>, along with API_HTTPS_* fields.
	// - REDIRECT_LISTEN_HTTP unset (default)
	// - HOST_FRONTEND unset (default)
	// You can disable CORS (auto-respond with *) in a private environment:
	// - DISABLE_CORS_CHECKS unset (!isProduction default, optional)
	// - API_ORIGIN=<url> (http://localhost default, something else if desired or using a different port)
	// - FRONTEND_ORIGIN=<url> (optional, http://localhost:3000 default to match the frontend dev server)
	//
	//
	// Full Stack:
	//
	// With this configuration, sr-server hosts the frontend static site code and runs the
	// backend over HTTPS. This also includes an HTTP redirect server (which isn't super
	// relevant these days).
	// Set publishing options:
	// - MAIN_LISTEN_HTTPS=<port>     (< you should use other ports and forward to 80/443 if possible)
	// - REDIRECT_LISTEN_HTTP=<port> (< this makes running as non-root user a non-issue)
	// - HOST_FRONTEND=by-host-header (default unset, publish the frontend/api via a Host header check)
	// The frontend publishes at the Host/subdomain specified in the CORS options:
	// - FRONTEND_ORIGIN=<origin> (i.e. https://my.site)
	// - API_ORIGIN=<origin> (i.e. https://api.my.site)
	//
	//
	// Backend Only:
	//
	// In this configuration, you run the frontend through a static provider
	// (it should work with anything that supports an SPA) and the backend on its
	// own. You may not need the redirect server if you're behind a reverse proxy.
	// HTTP API server behind a reverse proxy:
	// - REVERSE_PROXIED=true (required to set in production)
	// - MAIN_LISTEN_HTTP=<port>
	// Or to publish HTTPS:
	// - MAIN_LISTEN_HTTPS=<port>
	// Don't publish the redirect or frontend:
	// - REDIRECT_LISTEN_HTTP unset (default)
	// - HOST_FRONTEND unset (default)
	// CORS:
	// - FRONTEND_ORIGIN=<origin> (still needed for CORS)
	// - API_ORIGIN=<origin> (still needed for CORS)

	// Main server configuration (API and optional frontend)

	// MainListenHTTP is the port which the main server listens for HTTP requests
	MainListenHTTP = readString("MAIN_LISTEN_HTTP", ":3001")
	// MainListenHTTPS is the port which the main server listens for HTTPS requests
	MainListenHTTPS = readString("MAIN_LISTEN_HTTPS", "")
	// HostFrontend determines if and how the frontend site is hosted:
	// - by-domain: check Host header and {Front, Back}endOrigin config values
	// - subroute: host frontend at / and API at /api
	// - redirect: redirect / to FrontendOrigin
	HostFrontend = readString("HOST_FRONTEND", "")

	// Redirect server configuration (HTTP -> HTTPS forwarder)

	// RedirectListenHTTP is the port which the redirect server listens for HTTP requests
	RedirectListenHTTP = readString("REDIRECT_LISTEN_HTTP", "")
	// ReverseProxied must be set to true if an HTTP-only main server is used on
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

	// TLSAutocertDir is the directory where Let's Encrypt certificates are kept.
	TLSAutocertDir = readString("TLS_AUTOCERT_CERT_DIR", "")
	// TLSCertFiles is a list of the file names for the pem, private key cert files.
	TLSCertFiles = readStringArray("TLS_CERT_FILES", "")

	// CORS options
	// These are the origins that we allow cross-origin requests between.
	// If the frontend is hosted by sr-server, it uses the FrontendOrigin to check
	// the Host header of requests.

	// DisableCORS disables the CORS checks and sends the host forward. Not compatible
	// with a production environment. If CORS checks are disabled and the frontend isn't
	// being hosted or redirected to (as is the typical development case), FrontendOrigin is unused.
	DisableCORS = readBool("DISABLE_CORS_CHECKS", !IsProduction)
	// BackendOrigin is the origin (scheme://host:port) for the backend server
	BackendOrigin = readOrigin("BACKEND_ORIGIN", "http://localhost:3001")
	// FrontendOrigin is the origin (scheme://host:port) for the frontend server
	FrontendOrigin = readOrigin("FRONTEND_ORIGIN", "http://localhost:3000")

	// Frontend server configuration
	// These options are used when the frontend site is hosted via the main server.

	// FrontendBasePath is the base path for the frontend.
	FrontendBasePath = readString("FRONTEND_BASE_PATH", "")
	// FrontendGzipped indicates a .gz copy of each file on the frontend is pregenerated
	FrontendGzipped = readBool("FRONTEND_GZIPPED", true)
	// UnhostedFrontendRedirect toggles whether the root URL of the main server should point
	// to the frontend domain, when the frontend is not being hosted.
	UnhostedFrontendRedirect = readBool("UNHOSTED_FRONTEND_REDIRECT", true)
	// FrontendRedirectPermanent toggles whether the redirect to the frontend domain is permanent.
	// This should really only be used for shadowroller.net
	FrontendRedirectPermanent = readBool("FRONTEND_REDIRECT_PERMANENT", false)

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
	SSEPingSecs = readInt("SSE_PING_SECS", 18)
	// MaxHeaderBytes is the maximum number of header bytes which can be read by
	// the Go server.
	MaxHeaderBytes = readInt("MAX_HEADER_BYTES", 1<<20)
	// MaxRequestsPer10Secs is a per-address rate limit for all endpoints.
	// For details, see `middleware.go`.
	MaxRequestsPer10Secs = readInt("MAX_REQUESTS_PER_10SECS", 30)

	// TempSessionTTLSecs is the amount of time a temporary session is stored
	// in redis after the subscription disconnects.
	TempSessionTTLSecs = readInt("TEMP_SESSION_TTL_SECS", 15*60)
	// PersistSessionTTLDays is the amount of time persistent sessions last.
	PersistSessionTTLDays = readInt("PERSIST_SESSION_TTL_DAYS", 30)

	// HTTP options

	// ClientIPHeader sets a header to use for client IP addresses instead
	// of just using the request's RemoteAddr. If the header is not found,
	// RemoteAddr is used.
	ClientIPHeader = readString("CLIENT_IP_HEADER", "")
	// LogExtraHeaders allows for more headers to be logged with each request
	LogExtraHeaders = readStringArray("LOG_EXTRA_HEADERS", "")

	// Library Options

	// OtelExport controls how otel traces and metrics are exported.
	// - stdout      => exported to stdout. Not pretty.
	// - oltp:url    => exported to the given otel endpoint.
	// - uptrace => oltp exported to Uptrace with the given dsn
	OtelExport = readString("OTEL_EXPORT", "uptrace")

	// UptraceDSNFile controls the keyfile used for Uptrace export
	UptraceDSN = readFile("OTEL_DSN_FILE", "../data/otel-dsn.txt", "")

	UptraceExportURL = readString("OTEL_EXPORT_URL", "otlp.uptrace.dev:4317")

	// RedisURL is the URI used to dial redis.
	RedisURL = readString("REDIS_URL", "redis://:6379")
	// RedisRetries controls the number of times a retry is attempted for some retryable
	// redis queries.
	RedisRetries = readInt("REDIS_RETRIES", 5)
	// RedisHealthcheckSecs controls the healthcheck interval for the redis client and
	// pubsub connections.
	RedisHealthcheckSecs = readInt("REDIS_HEALTHCHECK_SECS", 15)

	// Backend options

	// HealthCheckSecretKey allows for sending debug info with health checks.
	// If the contents of this key are passed to /health-check, debug info is sent.
	// This is always done in development. Leave blank to disable in production.
	HealthCheckSecretKey = readKeyFile("KEYFILE_HEALTHCHECK", "")

	// EnableTasks enables the /task route, which includes administrative commands.
	// It is recommended you run a separate sr-server instance with this enabled to
	// perform administrative tasks.
	EnableTasks = readBool("ENABLE_TASKS", !IsProduction)
	// TasksLocalhostOnly enables the localhost filter on the tasks route.
	// Don't use this to conceal /task from the internet! Shadowroller cannot guarantee
	// you won't receive a request pretending to be from localhost.
	TasksLocalhostOnly = readBool("TASKS_LOCALHOST_ONLY", true)

	// HardcodedGameNames is a comma-separated list of GameIDs which the server
	// creates on startup.
	HardcodedGameNames = readStringArray("GAME_NAMES", "test1,test2")
	// HardcodedUsernames is a comma-separated list of usernames which the server creates on startup
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
	log.Printf("config: read env string SR_%v", name)
	return val
}

func readStringArray(name string, defaultValue string) []string {
	val, ok := os.LookupEnv("SR_" + name)
	if ok {
		log.Printf("config: read env string array SR_%v", name)
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
	log.Printf("config: read env int SR_%v", name)
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
	log.Printf("config: read env bool SR_%v", name)
	val, err := strconv.ParseBool(envVal)
	if err != nil {
		panic("Unable to read " + name + ": " + envVal)
	}
	return val
}

func readOrigin(name string, defaultValue string) *url.URL {
	envVal, ok := os.LookupEnv("SR_" + name)
	if !ok {
		parsed, err := url.Parse(defaultValue)
		if err != nil {
			panic(fmt.Sprintf("error parsing default value origin for SR_%v: `%v`", name, defaultValue))
		}
		return parsed
	}
	log.Printf("config: read env origin SR_%v", name)
	val, err := url.Parse(envVal)
	if err != nil {
		panic(fmt.Sprintf("Unable to parse SR_%v: %v", name, envVal))
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
	if contents == "" && name != "KEYFILE_HEALTHCHECK" {
		log.Print("config: empty key ", name, " used!")
		return []byte(contents)
	}
	val, err := base64.StdEncoding.DecodeString(contents)
	if err != nil {
		panic(fmt.Sprintf("Unable to decode key %v: %v", name, err))
	}
	return val
}

func readFile(name string, defaultPath string, defaultValue string) string {
	envVal, ok := os.LookupEnv("SR_" + name)
	var foundPath string
	if !ok {
		foundPath = defaultPath
	} else {
		log.Printf("config: read env file SR_%v", name)
		foundPath = envVal
	}

	fileContent, err := ioutil.ReadFile(foundPath)
	if err != nil {
		log.Printf("config: unable to read file %v: %v", name, err)
		return defaultValue
	}
	// Allow for a trailing newline in the file
	return strings.TrimSpace(string(fileContent))
}

// VerifyConfig performs sanity checks and prints warnings.
func VerifyConfig() {
	if IsProduction {
		if SlowResponsesDebug {
			log.Print("Warning: SlowResponsesDebug = false on production")
		}
		if MainListenHTTP != "" && !ReverseProxied {
			panic("Must set ReverseProxied if using an HTTP server on production")
		}
		if BackendOrigin.Host == "localhost" {
			log.Print("Warning: Hostname = \"localhost\" on production")
		}
		if len(HealthCheckSecretKey) != 0 && len(HealthCheckSecretKey) < 256 {
			panic("HealthcheckSecretKey should be longer")
		}
	}
	if _, err := redis.ParseURL(RedisURL); err != nil {
		panic(fmt.Sprintf("Unable to parse redis URL: %v", err))
	}
	if RedirectListenHTTP == MainListenHTTPS && MainListenHTTPS != "" {
		panic("Cannot publish HTTP redirect and HTTPS servers on the same port!")
	}
	if (MainListenHTTP == "") == (MainListenHTTPS == "") {
		panic("Must set one of MAIN_LISTEN_HTTP and MAIN_LISTEN_HTTPS!")
	}
	if RedirectListenHTTP != "" {
		if MainListenHTTP == RedirectListenHTTP {
			panic("Cannot publish HTTP server and redirect server on the same port!")
		} else if MainListenHTTP != "" {
			log.Print("Warning: publishing HTTP main server and HTTP redirect server.")
		}
	}
	if MainListenHTTPS != "" && ((TLSAutocertDir == "") == (len(TLSCertFiles) == 0)) {
		panic("Must set one of TLSAutocertDir and TLSCertFiles!")
	}

	if HostFrontend != "" && HostFrontend != "by-domain" && HostFrontend != "redirect" && HostFrontend != "subroute" {
		panic("Invalid value for HostFrontend; expected unset, redirect, subroute, or by-domain!")
	}
	if HostFrontend == "by-domain" && (FrontendOrigin.Host == BackendOrigin.Host) {
		panic("Must have differing FRONTEND_DOMAIN and BACKEND_DOMAIN hosts for HOST_FRONTEND=by-domain")
	}
	if HostFrontend != "" && HostFrontend != "redirect" && FrontendBasePath == "" {
		panic("Frontend is hosted, FRONTEND_BASE_PATH must be set!")
	}
}
