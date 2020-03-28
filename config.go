package srserver

import (
	"os"
)

var (
	// Server configs
	ServerAddress   = readVar("SERVER_ADDRESS")
	ServerPort      = readVar("SERVER_PORT")
	FrontendAddress = readVar("FRONTEND_ADDRESS")
	// TLS configs
	TlsEnable = readVar("TLS_ENABLE")
	TlsHost   = readVar("TLS_HOST")
	// Timeouts
	ReadTimeoutSecs     = readVar("READ_TIMEOUT_SECS")
	WriteTimeoutSecs    = readVar("WRITE_TIMEOUT_SECS")
	SSEWriteTimeoutSecs = readVar("SSE_WRITE_TIMEOUT_SECS")
	MaxHeaderBytes      = readvar("MAX_HEADER_BYTES")
	// Backend options
)

func readString(name String) String {
	val, ok := os.LookupEnv(name)
}

func readInt(name String) Int {

}

func Create() {

}
