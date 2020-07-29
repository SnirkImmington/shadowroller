package sr

import (
	"fmt"
	"github.com/gomodule/redigo/redis"
	"log"
	"sr/config"
	"strings"
	"time"
    "os"
)

var redisLogger *log.Logger

// RedisPool is the pool of redis connections
var RedisPool = &redis.Pool{
	MaxIdle:     10,
	IdleTimeout: time.Duration(60) * time.Second,
	Dial: func() (redis.Conn, error) {
		conn, err := redis.DialURL(config.RedisURL)
        if config.RedisDebug && err == nil {
            return redis.NewLoggingConn(conn, redisLogger, "redis"), nil
        }
        return conn, err
	},
}

// CloseRedis closes a redis connection and logs errors if they occur
func CloseRedis(conn redis.Conn) {
	err := conn.Close()
	if err != nil {
		log.Printf("Error closing redis connection: %v", err)
	}
}

func SetupRedis() {
    if config.RedisDebug {
        redisLogger = log.New(os.Stdout, "", log.Ltime | log.Lshortfile)
    }

	conn := RedisPool.Get()
	defer CloseRedis(conn)

	// Initialize games

	gameNames := strings.Split(config.HardcodedGameNames, ",")

	for _, game := range gameNames {
		_, err := conn.Do("hmset", "game:"+game, "event_id", 0)
		if err != nil {
			panic(fmt.Sprintf("Unable to hardcode games: ", err))
		}
	}

	log.Print("Registered ", len(gameNames), " hardcoded game IDs.")
}
