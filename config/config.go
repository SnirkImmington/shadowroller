package config

import (
	"os"
	"strconv"
)

var (
	IsProduction = readBool("IS_PRODUCTION", false)
	// Server configs
	ServerAddress   = readString("SERVER_ADDRESS", ":3001")
	FrontendAddress = readString("FRONTEND_ADDRESS", "localhost:3000")
	// TLS configs
	TlsEnable = readBool("TLS_ENABLE", false)
	TlsHost   = readString("TLS_HOST", "https://shadowroller.immington.industries")
	CertDir   = readString("CERT_DIR", "/var/sr-server/cert/")
	// Timeouts
	ReadTimeoutSecs     = readInt("READ_TIMEOUT_SECS", 30)
	WriteTimeoutSecs    = readInt("WRITE_TIMEOUT_SECS", 30)
	IdleTimeoutSecs     = readInt("IDLE_TIMEOUT_SECS", 60)
	SSEWriteTimeoutSecs = readInt("SSE_WRITE_TIMEOUT_SECS", 30)
	MaxHeaderBytes      = readInt("MAX_HEADER_BYTES", 1<<20)
	// LibraryOptions
	RedisUrl = readString("REDIS_URL", "redis://redis:6379")
	// Backend options
	HardcodedGameNames = readString("GAME_NAMES", "testgame1,testgame2")
	RollBufferSize     = readInt("ROLL_BUFFER_SIZE", 200)
)

func readString(name string, defaultValue string) string {
	val, ok := os.LookupEnv("SR_" + name)
	if !ok {
		return defaultValue
	}
	return val
}

func readInt(name string, defaultValue int) int {
	val, err := strconv.Atoi(name)
	if err != nil {
		return defaultValue
	}
	return val
}

func readBool(name string, defaultValue bool) bool {
	val, err := strconv.ParseBool(name)
	if err != nil {
		return defaultValue
	}
	return val
}
