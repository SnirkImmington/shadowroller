package srserver

// Server routing

import (
	gorillaMux "github.com/gorilla/mux"
	"io"
	"log"
	"srserver/config"
	"strings"
)

func RegisterDefaultGames() {
	conn := redisPool.Get()
	defer conn.Close()

	gameNames := strings.Split(config.HardcodedGameNames, ",")

	var err error
	for _, game := range gameNames {
		_, err = conn.Do("hmset", "game:"+game, "event_id", 0)
		if err != nil {
			log.Print("Error:", err)
			return
		}
	}

	log.Print("Registered ", len(gameNames), " hardcoded game IDs.")
}

func MakeServerMux() *gorillaMux.Router {
	mux := gorillaMux.NewRouter()

	mux.HandleFunc("/join-game", loggedHandler(handleJoinGame)).Methods("POST")

	mux.HandleFunc("/events", loggedHandler(handleEvents)).Methods("GET")

	mux.HandleFunc("/roll", loggedHandler(handleRoll)).Methods("POST")

	mux.HandleFunc("/", loggedHandler(func(response Response, request *Request) {
		io.WriteString(response, "Hello world!")
	}))

	mux.HandleFunc("/health-check", loggedHandler(func(response Response, request *Request) {
		io.WriteString(response, "ok")
	}))

	return mux
}
