package config

import (
	"context"
	"fmt"
	"reflect"
	"time"
)

type configContextKey int

var configKey configContextKey = 0

func Get(ctx context.Context) *Config {
	found := ctx.Value(configKey)
	// I'd like to return the default config and print a warning here,
	// but we have no way of knowing if we're actually on prod or not,
	// and we should panic on prod in case our caller is going to do
	// something that the default conf would allow but prod would not.
	if found == nil {
		panic("context did not contain SR config!")
	}
	return found.(*Config)
}

func Set(ctx context.Context, config *Config) context.Context {
	return context.WithValue(ctx, configKey, config)
}

// defaultKey is a selected quote from the Shadowrun (TM) franchise.
const defaultKey = "argle bargle, foofaraw, hey diddy hoe diddy"

type Config struct {
	values []Value

	// Production Toggle

	// IsProduction toggles a variety of safety checks. When disabled, critical
	// information can be leaked to clients.
	// **Set this to true if exposing yourself to the internet.**
	IsProduction Bool

	// Debug Toggles - extra log channels

	// DebugCORS toggles logging CORS queries from the girhub/rs/cors library.
	DebugCORS Bool
	// DebugRedis toggles logging every command sent to Redis.
	DebugRedis Bool
	// DebugRedisConns toggles logging of redis client connections being opened
	// and closed.
	DebugRedisConns Bool
	// DebugResq toggles extra logging of resq code.
	DebugResq Bool
	// DebugWs toggles extra logging of client WebSocket connections.
	DebugWS Bool
	// DebugOtel toggles logging of otel processes.
	DebugOtel Bool
	// DebugShutdown toggles logging of libsr/shutdown handlers.
	DebugShutdown Bool

	// Developer options

	// SlowResponses enables a delay in all responses from the gateway. It is
	// intended for debugging the frontend's appearance when requests are slow.
	SlowResponses Bool
	// DisableCORS disables server-side CORS checks entirely. It cannot be used
	// in production.
	DisableCORS Bool

	// HTTP options - apply to frontend and gateway.

	// GatewayHTTPPort is the port which the gateway listens for HTTP requests.
	HTTPPort String
	// GatewayHTTPSPort is the port which the gateway listens for HTTP requests.
	HTTPSPort String
	// HTTPProtocol determines if the server is hosted with HTTP or HTTPS:
	// "http" and "https" start one server with the given port, "both" starts
	// both in parallel, "redirect" starts a redirect server at HTTPPort that
	// points to HTTPSPort.
	HTTPProtocol String
	// HTTPReverseProxied must be set on production when the gateway is running
	// behind HTTPS termination (HTTProtocol is "http" or "both").
	HTTPReverseProxied Bool
	// HTTPReadTimeout is the read timeout for HTTP requests.
	HTTPReadTimeout Dur
	// HTTPWriteTimeout is the write timeout for HTTP requests.
	HTTPWriteTimeout Dur
	// HTTPIdleTimeout is the idle timeout for HTTP requests.
	HTTPIdleTimeout Dur
	// HTTPMaxHeaderBytes is the maximum number of HTTP header bytes a client is
	// allowed to send before we reject their request.
	HTTPMaxHeaderBytes Int
	// HTTPMaxRequestsPer10Secs is the number of requests a given client (ip:port)
	// is allowed to send in a ten second window.
	HTTPMaxRequestsPer10Secs Int
	// HTTPResponseLength indicates how many items at a time we should return at
	// a time in pagination scenarios (such as the client reading through event
	// history).
	HTTPResponseCount Int
	// HTTPClientIPHeader indicates a given header should be used to determine
	// the client's IP. It should be set when operating behind a proxy.
	HTTPClientIPHeader String
	// HTTPLogExtraHeaders toggles logging values of the given headers with each
	// request. This can be used for loggin a client IP header, or a request ID
	// set by a proxy.
	HTTPLogExtraHeaders StringArray

	// TLS config - used by gateway and frontend when needed.

	// TLSAutocertCertDir if set enables the Let's Encrypt library and stores
	// cert files and info in the given directory.
	TLSAutocertCertDir String
	// TLSCertFiles if set uses the provided pem, private key cert files for HTTPS.
	TLSCertFiles StringArray

	// Gateway - gateway-specific HTTP config

	// GatewayTempSessionTTL is the duration of a temporary session.
	GatewayTempSessionTTL Dur
	// GatewayPersistSesstionTTL is the duration of a persistent session.
	GatewayPersistSesstionTTL Dur
	// HealthcheckKey can be set to log extra data from the /healthcheck endpoint
	// if the key is given as the Auth parameter.
	HealthcheckKey Key
	// JWTVersion is the version number set on new auth JWTs.
	JWTVersion Int
	// JWTMinVersion if set causes JWTs with smaller version numbers to be
	// automatically signed out. A new version of this number can be deployed to
	// the gateway to sign out all users.
	JWTMinVersion Int
	// JWTKey is the keyfile used to encode JWTs. It should point to a base64
	// encoded file containing a random 512 byte key.
	JWTKey Key
	// TODO WebSocket vars

	// BackendOrigin is the domain of the site backend/API. This is used by a
	// variety of services for configuration, but also for formatting URLs on the
	// site in general.
	BackendOrigin URL

	// FrontendOrigin is the domain of the site frontend/API. This is also used
	// by the gateway service to provide redirects.
	FrontendOrigin URL

	// Frontend configuration - used by the frontend service

	// FrontendBasePath is the path to the compiled frontend files
	FrontendBasePath String
	// FrontendGzipped determines whether the frontend server has access to
	// pre-gzipped versions of its compressible files.
	FrontendGzipped Bool
	// FrontendRedirectOnly indicates that the frontend server should only host
	// a redirect to another site. This is used in development, when the frontend
	// is hosted by Node, and if the frontend were hsoted on a separate platform.
	FrontendUnhostedRedirect Bool
	// FrontendRedirectPermanent indicates whether the frontend redirect sent
	// should be a permanent one.
	FrontendRedirectPermanent Bool

	// Otelexport is the export strategy used for otel traces and metrics.
	// - stdout   => use the standard stdout logging
	// - oltp:url => export to the given oltp endpoint.
	// - uptrace  => use UptraceDSN to export to Uptrace.
	OtelExport String
	// UptraceDSN is the secret URI to upload otel traces and metrics to. Used
	// when OtelExport is "uptrace"
	UptraceDSN String
	// UptraceExportUrl is the domain of Uptrace. This should only be modified
	// if you're not using Uptraces's regular domain for some reason.
	UptraceExportURL String

	// RedisURL is the URI used to dial redis; it should be a "redis://" URI.
	RedisURL String
	// RedisRetries is the number of times retryable redis queries or transactions
	// should be retried
	RedisRetries Int
	// RedisHealthcheck not used if we don't use pub/sub

	// Tasks flags

	// TasksEnable enables tasks
	TasksEnable Bool
	// TasksLocalhostOnly sets tasks to only listen on localhost
	TasksLocalhostOnly Bool

	// Hardcoded data - added to database on startup if specified and not prod

	// HardcodedGameNames are game IDs to create
	HardcodedGameNames StringArray
	// HardcodedUsernames are users to create
	HardcodedUsernames StringArray

	// Game "settings" - these are not related to the whole "being a server"
	// thing that most of the code seems to be focused on.

	// RollBufferSize is the size of the buffer a client should keep when rolling
	// dice.
	RollBufferSize Int
	// MaxSingleRoll is the number of dice a client is allowed to roll at a time.
	MaxSingleRoll Int
}

func DefaultConfig() *Config {
	c := &Config{}

	c.IsProduction = boolVar(c, "IS_PRODUCTION", false)

	c.DebugCORS = boolVar(c, "DEBUG_CORS", false)
	c.DebugRedis = boolVar(c, "DEBUG_REDIS", false)
	c.DebugRedisConns = boolVar(c, "DEBUG_REDIS_CONNS", false)
	c.DebugResq = boolVar(c, "DEBUG_RESQ", true)
	c.DebugWS = boolVar(c, "DEBUG_WS", true)
	c.DebugOtel = boolVar(c, "DEBUG_OTEL", true)
	c.DebugShutdown = boolVar(c, "DEBUG_SHUTDOWN", true)

	c.SlowResponses = boolVar(c, "SLOW_RESPONSES", false)
	c.DisableCORS = boolVar(c, "DISABLES_CORS_CHECKS", !c.IsProduction.Get())

	c.HTTPPort = stringVar(c, "HTTP_PORT", ":3001")
	c.HTTPSPort = stringVar(c, "HTTPS_PORT", "")
	c.HTTPProtocol = stringVar(c, "HTTP_PROTOCOL", "http")
	c.HTTPReverseProxied = boolVar(c, "HTTP_REVERSE_PROXIED", false)
	c.HTTPReadTimeout = durVar(c, "HTTP_READ_TIMEOUT", time.Duration(30)*time.Second)
	c.HTTPWriteTimeout = durVar(c, "HTTP_WRITE_TIMEOUT", time.Duration(30)*time.Second)
	c.HTTPIdleTimeout = durVar(c, "HTTP_IDLE_TIMEOUT", time.Duration(60)*time.Second)
	c.HTTPMaxHeaderBytes = intVar(c, "HTTP_MAX_HEADER_BYTES", 1<<20)
	c.HTTPMaxRequestsPer10Secs = intVar(c, "HTTP_MAX_REQUESTS_PER_10SECS", 5)
	c.HTTPResponseCount = intVar(c, "HTTP_RESPONSE_COUNT", 50)
	c.HTTPClientIPHeader = stringVar(c, "HTTP_CLIENT_IP_HEADER", "")
	c.HTTPLogExtraHeaders = stringArrayVar(c, "HTTP_LOG_EXTRA_HEADERS", "")

	c.TLSAutocertCertDir = stringVar(c, "TLS_AUTOCERT_CERT_DIR", "")
	c.TLSCertFiles = stringArrayVar(c, "TLS_CERT_FILES", "")

	c.GatewayTempSessionTTL = durVar(c, "GATEWAY_TEMP_SESSION_TTL", time.Duration(24)*time.Hour)
	c.GatewayPersistSesstionTTL = durVar(c, "GATEWAY_PERSIST_SESSION_TTL", time.Duration(30*24)*time.Hour)
	c.HealthcheckKey = keyfileVar(c, "SR_HEALTHCHECK_KEY", "../data/healthcheck.key", []byte{})
	c.JWTVersion = intVar(c, "JWT_VERSION", 1)
	c.JWTMinVersion = intVar(c, "JWT_MIN_VERSION", 2)
	c.JWTKey = keyfileVar(c, "JWT_KEY", "../data/jwt-keyfile.txt", []byte(defaultKey))

	c.BackendOrigin = urlVar(c, "BACKEND_ORIGIN", "http://localhost:3001")
	c.FrontendOrigin = urlVar(c, "FRONTEND_ORIGIN", "http://localhost:3000")

	c.FrontendBasePath = stringVar(c, "FRONTEND_BASE_PATH", "")
	c.FrontendGzipped = boolVar(c, "FRONTEND_GZIPPED", true)
	c.FrontendUnhostedRedirect = boolVar(c, "FRONTEND_UNHOSTED_REDIRECT", true)
	c.FrontendRedirectPermanent = boolVar(c, "FRONTEND_REDIRECT_PERMANENT", true)

	c.OtelExport = stringVar(c, "OTEL_EXPORT", "stdout")
	c.UptraceDSN = fileVar(c, "UPTRACE_DSN_FILE", "../data/otel-dsn.txt", "")
	c.UptraceExportURL = stringVar(c, "UPTRACE_EXPORT_URL", "otlp.uptrace.dev:4317")

	c.RedisURL = stringVar(c, "REDIS_URL", "redis://:6379")
	c.RedisRetries = intVar(c, "REDIS_RETRIES", 5)
	// c.RedisHealthcheck = durVar(c, "REDIS_HEALTHCHECK", time.Duration(15) * time.Second)

	// tasksEnable, TasksLocalhostOnly

	c.HardcodedGameNames = stringArrayVar(c, "GAME_NAMES", "test1,test2")
	c.HardcodedUsernames = stringArrayVar(c, "USERNAMES", "snirk,smark,smirk")

	c.RollBufferSize = intVar(c, "ROLL_BUFFER_SIZE", 200)
	c.MaxSingleRoll = intVar(c, "MAX_SINGLE_ROLL", 100)

	AssertConfigCodeIsFullyWritten(c) // expected to fail

	return c
}

func AssertConfigCodeIsFullyWritten(conf *Config) {
	configType := reflect.TypeOf(conf).Elem()
	// #fields in type - the `values` field - all fields initialized
	missingFields := configType.NumField() - 1 - len(conf.values)
	if missingFields > 0 {
		msg := fmt.Sprintf("Default config has %v unconfigured struct fields", missingFields)
		panic(msg)
	}
}
