package redis

import (
	"context"
	"fmt"
	"strings"

	"shadowroller.net/libsr/log"

	"github.com/go-redis/redis/v8"
)

type printHook struct{}

var hooks redis.Hook = printHook{}

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

func (printHook) BeforeProcess(ctx context.Context, cmd redis.Cmder) (context.Context, error) {
	return ctx, nil
}

func (printHook) AfterProcess(ctx context.Context, cmd redis.Cmder) error {
	log.Print(ctx, printCmd(cmd))
	return nil
}

func (_ printHook) BeforeProcessPipeline(ctx context.Context, cmds []redis.Cmder) (context.Context, error) {
	return ctx, nil
}

func (_ printHook) AfterProcessPipeline(ctx context.Context, cmds []redis.Cmder) error {
	log.Printf(ctx, "Pipeline %v:", len(cmds))
	for ix, cmd := range cmds {
		log.Printf(ctx, "%02d %v", ix, printCmd(cmd))
	}
	return nil
}
