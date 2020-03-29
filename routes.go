package srserver

// Server routing

import (
	"fmt"
	"github.com/gomodule/redigo/redis"
	"io"
	"log"
	"net/http"
	"srserver/config"
	"strings"
)

type Response = http.ResponseWriter
type Request = http.Request

func RegisterDefaultGames() {
	conn := redisPool.Get()
	defer conn.Close()

	gameNames := strings.Split(config.HardcodedGameNames, ",")
	log.Print("Registering ", len(gameNames), " game IDs...")

	_, err := conn.Do("sadd", "game_ids", gameNames)
	if err != nil {
		log.Print("Error:", err)
		return
	}

	log.Print("Registered hardcoded game IDs.")
}

func MakeServerMux() *http.ServeMux {
	mux := &http.ServeMux{}

	handleRequest := func(path string, handler HandlerFunc) {
		mux.HandleFunc(path, makeRequestHandler(handler))
	}
	handleRedisRequest := func(path string, handler RedisHandlerFunc) {
		mux.HandleFunc(path, makeRedisRequestHandler(handler))
	}

	handleRequest("/", func(response Response, request *Request) {
		io.WriteString(response, "Hello world!")
	})

	handleRedisRequest("/join-game", handleJoinGame)

	handleRequest("/health-check", func(response Response, request *Request) {
		io.WriteString(response, "ok")
	})

	handleRedisRequest("/get-games", func(response Response, request *Request, conn redis.Conn) {
		members, err := redis.Strings(conn.Do("smembers", "game_ids"))
		if err != nil {
			log.Print("Error:", err)
			http.Error(response, err.Error(), http.StatusInternalServerError)
		}
		fmt.Fprintf(response, "%v", members)
	})

	handleRequest("/error", handleThrowAnError)

	return mux
}
