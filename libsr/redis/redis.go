package redis

import (
	"context"
	"fmt"

	"shadowroller.net/libsr/config"
	"shadowroller.net/libsr/log"

	"github.com/go-redis/redis/v8"
)

// Client is the redis client to be used across the service. It is initialized in
// main and is closed in `Close()`
var Client *redis.Client

// RetryWatchTxn retries a WATCH transaction based on config.RedisRetries.
func RetryWatchTxn(ctx context.Context, client *redis.Client, txf func(*redis.Tx) error, keys ...string) error {
	for i := 0; i < config.RedisRetries; i++ {
		err := client.Watch(ctx, txf, keys...)
		if err == nil {
			return nil
		}
		if err == redis.TxFailedErr {
			continue
		}
		return fmt.Errorf("%w (try %v)", err, i+1)
	}
	return fmt.Errorf("%w: no more retries", redis.TxFailedErr)
}

// SetupWithConfig configures Client.
func SetupWithConfig() {
	opts, err := redis.ParseURL(config.RedisURL)
	if err != nil {
		panic(fmt.Sprintf("Error parsing redis URL even after config check: %v", err))
	}
	opts.MaxRetries = config.RedisRetries
	opts.PoolSize = 10 // I don't think we get accurate information running in a container.
	if config.RedisConnectionsDebug {
		opts.OnConnect = func(ctx context.Context, conn *redis.Conn) error {
			log.Stdoutf(ctx, "Connected to redis: %v", conn)
			return nil
		}
	}
	Client = redis.NewClient(opts)
	if config.RedisDebug {
		Client.AddHook(hooks)
	}
	if config.OtelExport != "" {
		SetupTracer()
		Client.AddHook(NewTraceHook())
	}
}

// Close closes the redis client(s). It should only be called at process termination.
func Close(ctx context.Context) {
	if config.RedisConnectionsDebug {
		log.Stdout(ctx, "Called redisUtil.Close()")
	}
	err := Client.Close()
	if err != nil {
		log.Printf(ctx, "Error closing redis conn: %v", err)
	}
}
