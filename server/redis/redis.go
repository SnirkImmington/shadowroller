package redis

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"sr/config"
	"sr/taskCtx"

	"github.com/go-redis/redis/v8"
)

var logger *log.Logger

// Client is the redis client to be used across the service. It is initialized in
// main and is closed in `Close()`
var Client *redis.Client

type redisHooks struct{}

var hooks redis.Hook = redisHooks{}

func printCmd(cmd redis.Cmder) string {
	var nameParts []string
	for ix, arg := range cmd.Args() {
		if ix == 0 {
			nameParts = append(nameParts, strings.ToUpper(arg.(string)))
		} else {
			nameParts = append(nameParts, fmt.Sprintf("%v", arg))
		}
	}
	name := strings.Join(nameParts, " ")
	full := cmd.String()
	if len(full) > len(name)+2 {
		return fmt.Sprintf("%v => %v", name, full[len(name)+2:])
	}
	return full
}

func (_ redisHooks) BeforeProcess(ctx context.Context, cmd redis.Cmder) (context.Context, error) {
	return ctx, nil
}

func (_ redisHooks) AfterProcess(ctx context.Context, cmd redis.Cmder) error {
	id := taskCtx.GetID(ctx)
	if id != 0 {
		taskCtx.RawLog(ctx, 1, "%v", printCmd(cmd))
	} else {
		logger.Printf("%v", printCmd(cmd))
	}
	return nil
}

func (_ redisHooks) BeforeProcessPipeline(ctx context.Context, cmds []redis.Cmder) (context.Context, error) {
	return ctx, nil
}

func (_ redisHooks) AfterProcessPipeline(ctx context.Context, cmds []redis.Cmder) error {
	id := taskCtx.GetID(ctx)
	if id != 0 {
		taskCtx.RawLog(ctx, 1, "Redis pipline (%v)", len(cmds))
		for ix, cmd := range cmds {
			taskCtx.RawLog(ctx, 1, "%02d: %v", ix, printCmd(cmd))
		}
	} else {
		logger.Printf("Pipeline %v:", len(cmds))
		for ix, cmd := range cmds {
			logger.Printf("%02d %v", ix, printCmd(cmd))
		}
	}
	return nil
}

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
	if config.RedisDebug || config.RedisConnectionsDebug {
		logger = log.New(os.Stdout, "", log.Ltime|log.Lshortfile)
	}
	opts, err := redis.ParseURL(config.RedisURL)
	if err != nil {
		panic(fmt.Sprintf("Error parsing redis URL even after config check: %v", err))
	}
	opts.MaxRetries = config.RedisRetries
	opts.PoolSize = 10 // I don't think we get accurate information running in a container.
	if config.RedisConnectionsDebug {
		opts.OnConnect = func(ctx context.Context, conn *redis.Conn) error {
			if id := taskCtx.GetID(ctx); id != 0 {
				taskCtx.Log(ctx, "Connected to redis")
			} else {
				logger.Printf("Connected to redis")
			}
			return nil
		}
	}
	Client = redis.NewClient(opts)
	if config.RedisDebug {
		Client.AddHook(hooks)
	}
}

// Close closes the redis client(s). It should only be called at process termination.
func Close() {
	if config.RedisConnectionsDebug {
		logger.Printf("Called redisUtil.Close()")
	}
	err := Client.Close()
	if err != nil {
		logger.Printf("Error closing redis conn: %v", err)
	}
}
