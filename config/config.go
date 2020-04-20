package config

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"os"
	"strconv"
)

var (
	IsProduction = readBool("IS_PRODUCTION", false)
	// Server configs
	ServerAddress   = readString("SERVER_ADDRESS", ":3001")
	ServerHTTPPort  = readString("SERVER_HTTP_PORT", ":80")
	ServerHTTPSPort = readString("SERVER_HTTPS_PORT", ":443")
	FrontendAddress = readString("FRONTEND_ADDRESS", "http://localhost:3000")
	StagingAddress  = readString("STAGING_ADDRESS", "http://srserver.null:3000")
	CORSDebug       = readBool("CORS_DEBUG", false)
	JWTSecretKey    = readKeyFile("KEYFILE_JWT", "133713371337")
	// TLS configs
	TlsEnable = readBool("TLS_ENABLE", false)
	TlsHost   = readString("TLS_HOST", "https://shadowroller.immington.industries")
	CertDir   = readString("CERT_DIR", "/var/sr-server/cert/")
	// Timeouts
	ReadTimeoutSecs  = readInt("READ_TIMEOUT_SECS", 30)
	WriteTimeoutSecs = readInt("WRITE_TIMEOUT_SECS", 30)
	IdleTimeoutSecs  = readInt("IDLE_TIMEOUT_SECS", 60)
	// I'd like to have write timeouts, but those are infamously set globally for the
	// server. The ResponseWriters we get can't set individual timeouts, so we can't
	// have write timeouts for regular requests AND sse.
	//SSEWriteTimeoutSecs = readInt("SSE_WRITE_TIMEOUT_SECS", 30)
	SSEClientRetrySecs = readInt("SSE_CLIENT_RETRY_SECS", 5)
	SSEPingSecs        = readInt("SSE_PING_SECS", 20)
	MaxHeaderBytes     = readInt("MAX_HEADER_BYTES", 1<<20)
	// LibraryOptions
	RedisUrl = readString("REDIS_URL", "redis://:6379")
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
