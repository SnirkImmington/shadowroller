package config

import (
	"encoding/base64"
	"os"
	"strconv"
)

var (
	IsProduction = readBool("IS_PRODUCTION", false)
	// Server configs
	ServerAddress   = readString("SERVER_ADDRESS", ":3001")
	CookieAddress   = readString("COOKIE_ADDRESS", "localhost")
	FrontendAddress = readString("FRONTEND_ADDRESS", "http://localhost:3000")
	JWTSecretKey    = []byte(readString("SECRET_JWT", "133713371337"))
	// TLS configs
	TlsEnable = readBool("TLS_ENABLE", false)
	TlsHost   = readString("TLS_HOST", "https://shadowroller.immington.industries")
	CertDir   = readString("CERT_DIR", "/var/sr-server/cert/")
	// Timeouts
	ReadTimeoutSecs     = readInt("READ_TIMEOUT_SECS", 30)
	WriteTimeoutSecs    = readInt("WRITE_TIMEOUT_SECS", 30)
	IdleTimeoutSecs     = readInt("IDLE_TIMEOUT_SECS", 60)
	SSEWriteTimeoutSecs = readInt("SSE_WRITE_TIMEOUT_SECS", 30)
	SSERetryTimeSecs    = readInt("SSE_RETRY_TIME_SECS", 10)
	MaxHeaderBytes      = readInt("MAX_HEADER_BYTES", 1<<20)
	// LibraryOptions
	RedisUrl = readString("REDIS_URL", "redis://redis:6379")
	// Backend options
	HardcodedGameNames = readString("GAME_NAMES", "test1,test2")
	RollBufferSize     = readInt("ROLL_BUFFER_SIZE", 200)
	MaxSingleRoll      = readInt("MAX_SINGLE_ROLL", 100)
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

func readKey(name string, defaultValue string) []byte {
	envVal, ok := os.LookupEnv("SR_" + name)
	if !ok {
		return []byte(defaultValue)
	}
	val, err := base64.StdEncoding.DecodeString(envVal)
	if err != nil {
		panic("Unable to decode key " + name)
	}
	return val
}
