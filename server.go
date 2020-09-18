package sr

import (
	"fmt"
	"github.com/gomodule/redigo/redis"
	"log"
	"os"
	"sr/config"
	"time"
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

// SetupRedis adds the game names from the config to Redis
// and sets up Redis logging if enabled.
func SetupRedis() {
	if config.RedisDebug {
		redisLogger = log.New(os.Stdout, "", log.Ltime|log.Lshortfile)
	}
	conn := RedisPool.Get()
	defer CloseRedis(conn)

	gameKeys, err := redis.Strings(conn.Do("keys", "game:*"))
	if err != nil {
		panic(fmt.Errorf("Error reading existing games from redis: %w", err))
	}
	for i, gameKey := range gameKeys {
		gameKeys[i] = gameKey[5:]
	}
	log.Print("Found games ", gameKeys)

	if len(gameKeys) < len(config.HardcodedGameNames) {
		// Initialize games
		for _, game := range config.HardcodedGameNames {
			_, err := conn.Do("hmset", "game:"+game, "event_id", 0)
			if err != nil {
				panic(fmt.Errorf("Unable to hardcode games: %w", err))
			}
		}
		log.Print("Registered ", len(config.HardcodedGameNames), " hardcoded game IDs.")
	}
}
