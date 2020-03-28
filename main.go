package srserver

import (
	"config"
	"fmt"
	"log"
	"time"
)

func main() {
	// Log to stdout for docker purposes
	server := &http.Server{
		Addr:           config.ServerPort,
		ReadTimeout:    config.ReadTimeoutSecs * time.Second,
		WriteTimeout:   config.WriteTimeoutSecs * time.Second,
		MaxHeaderBytes: config.MaxHeaderBytes,
	}

	fmt.Println("Hello, world!")

	log.Fatal(server.ListenAndServe())
}
