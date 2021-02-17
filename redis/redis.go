package redis

import (
	"context"
	"github.com/gomodule/redigo/redis"
	"log"
	"os"
	"sr/config"
	"time"
)

var logger *log.Logger

// RedisPool is the pool of redis connections
var pool = &redis.Pool{
	MaxIdle:     10,
	IdleTimeout: time.Duration(60) * time.Second,
	Dial: func() (redis.Conn, error) {
		conn, err := redis.DialURL(config.RedisURL)
		if config.RedisDebug && err == nil {
			return redis.NewLoggingConn(conn, logger, "redis"), nil
		}
		if config.RedisConnectionsDebug {
			log.Printf("Dialing connection from pool: %p", conn)
		}
		return conn, err
	},
	DialContext: func(ctx context.Context) (redis.Conn, error) {
		conn, err := redis.DialURL(config.RedisURL)
		if config.RedisDebug && err == nil {
			return redis.NewLoggingConn(conn, logger, "redis"), nil
		}
		if config.RedisConnectionsDebug {
			log.Printf("Dialing connection from pool: %p", conn)
		}
		return conn, err
	},
}

// Connect opens a connection from the redis pool
func Connect() redis.Conn {
	return pool.Get()
}

func ConnectWithContext(ctx context.Context) (redis.Conn, error) {
	return pool.GetContext(ctx)
}

// Close closes a redis connection and logs errors if they occur
func Close(conn redis.Conn) {
	if config.RedisConnectionsDebug {
		log.Printf("Called redisUtil.Close(): %p", conn)
	}
	if conn == nil {
		log.Printf("Attempted to close nil connection")
		return
	}
	err := conn.Close()
	if err != nil {
		log.Printf("Error closing redis connection %p: %v", conn, err)
	}
}

// SetupWithConfig sets up redis using Shadowroller's config
func SetupWithConfig() {
	if config.RedisDebug {
		logger = log.New(os.Stdout, "", log.Ltime|log.Lshortfile)
	}
}
