package redis

import (
	"context"
	"log"
	"os"

	"github.com/go-redis/redis/v8"

	"sr/config"
)

var logger *log.Logger

// Client is the redis client to be used across the service. It is initialized in
// main and is closed in `Close()`
var Client *redis.Client

type redisHooks struct{}

var hooks redis.Hook = redisHooks{}

func (_ redisHooks) BeforeProcess(ctx context.Context, cmd redis.Cmder) (context.Context, error) {
	log.Printf("Preparing to run %v", cmd)
	return ctx, nil
}

func (_ redisHooks) AfterProcess(ctx context.Context, cmd redis.Cmder) error {
	log.Printf("Result: %v", cmd)
	return nil
}

func (_ redisHooks) BeforeProcessPipeline(ctx context.Context, cmds []redis.Cmder) (context.Context, error) {
	log.Printf("Preparing to run %v", cmds)
	return ctx, nil
}

func (_ redisHooks) AfterProcessPipeline(ctx context.Context, cmds []redis.Cmder) error {
	log.Printf("Result: %v", cmds)
	return nil
}

// SetupWithConfig configures Client.
func SetupWithConfig() {
	opts := &redis.Options{
		MaxRetries: 10,
		PoolSize:   10,
	}
	if config.RedisConnectionsDebug {
		opts.OnConnect = func(ctx context.Context, conn *redis.Conn) error {
			log.Printf("Connected to redis")
			return nil
		}
	}
	Client = redis.NewClient(opts)
	if config.RedisDebug {
		logger = log.New(os.Stdout, "", log.Ltime|log.Lshortfile)
		//redis.SetLogger(logger) // It wants to send a context to each logging call
		Client.AddHook(hooks)
	}
}

// Close closes the redis client(s). It should only be called at process termination.
func Close() {
	if config.RedisConnectionsDebug {
		log.Printf("Called redisUtil.Close()")
	}
	err := Client.Close()
	if err != nil {
		log.Printf("Error closing redis conn: %v", err)
	}
}
