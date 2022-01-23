package config

import (
	"context"
	"fmt"
	"reflect"
)

type configContextKey int

var configKey configContextKey = 0

func Get(ctx context.Context) *Config {

}

func Set(ctx context.Context, config *Config) {

}

// defaultKey is a selected quote from the Shadowrun (TM) franchise.
const defaultKey = "argle bargle, foofaraw, hey diddy hoe diddy"

type Config struct {
	values []Value

	IsProduction Bool

	DebugCORS       Bool
	DebugRedis      Bool
	DebugRedisConns Bool
	DebugResq       Bool
	DebugWS         Bool
	DebugOtel       Bool
	DebugShutdown   Bool

	SlowResponses Bool

	HTTPMain           String
	HTTPListenSecure   String
	HTTPReverseProxied Bool
	HTTPReadTimeout    Dur
	HTTPWriteTimeout   Dur
	HTTPIdleTimeout    Dur
	// HTTPResponseLength indicates how many items at a time we should return at
	// a time in pagination scenarios (such as the client reading through event
	// history).
	HTTPResponseLength       Int
	HTTPMaxHeaderBytes       Int
	HTTPMaxRequestsPer10Secs Int
	HTTPTempSessionTTL       Dur
	HTTPPersistSesstionTTL   Dur
	HTTPClientIPHeader       String
	HTTPLogExtraHeaders      StringArray
	// TODO WebSocket vars

	TLSAutocertCertDir String
	TLSCertFiles       StringArray

	DisableCORS Bool

	BackendOrigin URL

	FrontendOrigin            URL
	FrontendBasePath          String
	FrontendGzipped           String
	FrontendUnhostedRedirect  Bool
	FrontendRedirectPermanent Bool

	JWTVersion Int
	JWTKey     Key

	OtelExport       String
	UptraceDSN       String
	UptraceExportURL String

	RedisURL         String
	RedisRetries     Int
	RedisHealthcheck Dur

	HealthcheckKey Key

	TasksEnable        Bool
	TasksLocalhostOnly Bool

	HardcodedGameNames StringArray
	HardcodedUsernames StringArray

	// RollBufferSize is the size of the buffer a client should keep when rolling
	// dice.
	RollBufferSize Int

	// MaxSingleRoll is the number of dice a client is allowed to roll at a time.
	MaxSingleRoll Int
}

func DefaultConfig() *Config {
	c := Config{}

	c.IsProduction = boolVar(c, "IS_PRODUCTION", false)

	c.DebugCORS = boolVar(c, "DEBUG_CORS", false)
	c.DebugRedis = boolVar(c, "DEBUG_REDIS", false)
	c.DebugRedisConns = boolVar(c, "DEBUG_REDIS_CONNS", false)
	c.DebugResq = boolVar(c, "DEBUG_RESQ", true)
	c.DebugWS = boolVar(c, "DEBUG_WS", true)
	c.DebugOtel = boolVar(c, "DEBUG_OTEL", true)
	c.DebugShutdown = boolVar(c, "DEBUG_SHUTDOWN", true)
	c.SlowResponses = boolVar(c, "SLOW_RESPONSES", false)

	c.HTTPMain = stringVar(c, "HTTP_LISTEN_MAIN", ":3001")
	c.HTTPListenSecure = stringVar(c, "HTTP_LISTEN_SECURE", "")
	c.HTTPReverseProxied = boolVar(c, "HTTP_REVERSE_PROXIED", false)
	c.TLSAutocertCertDir = stringVar(c, "TLS_AUTOCERT_CERT_DIR", "")
	c.TLSCertFiles = stringArrayVar(c, "TLS_CERT_FILES", "")

	c.DisableCORS = urlVar(c, "DISABLE_CORS", !c.IsProduction.Get())
	c.BackendOrigin = originVar(c, "BACKEND_ORIGIN", "http://localhost:3001")

	c.FrontendOrigin = originVar(c, "FRONTEND_ORIGIN", "http://localhost:3000")
	c.FrontendBasePath = stringVar(c, "FRONTEND_BASE_PATH", "")
	c.FrontendGzipped = boolVar(c, "FRONTEND_GZIPPED", true)
	c.FrontendUnhostedRedirect = boolVar(c, "FRONTEND_UNHOSTED_REDIRECT", true)
	c.FrontendRedirectPermanent = boolVar(c, "FRONTEND_REDIRECT_PERMANENT", true)

	c.JWTVersion = intVar(c, "JWT_VERSION", 1)
	c.JWTKey = keyfileVar(c, "JWT_KEYFILE", "../data/jwt-keyfile.txt", defaultKey)

	AssertConfigCodeIsFullyWritten(&c) // expected to fail

	return &c
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
