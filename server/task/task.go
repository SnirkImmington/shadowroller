package task

import (
	"context"
	"fmt"
	"os"

	"sr/game"
	"sr/log"
	"sr/shutdown"

	"github.com/go-redis/redis/v8"
)

// PrintAvailableTasks prints the list of CLI tasks
func PrintAvailableTasks(ctx context.Context) {
	tasks := []string{"migrate", "ppr"}
	log.Stdoutf(ctx, "Available tasks:\n\t%v", tasks)
}

// RunSelectedTask runs the passed in task from the command line
func RunSelectedTask(ctx context.Context, client *redis.Client, task string, args []string) {
	log.Printf(ctx, "Run task %v %v", task, args)
	ctx, release := shutdown.Register(ctx, fmt.Sprintf("task main - %v", task))
	// not really called because of os.Exit; we want the interrupt delay even if
	// we're not going to actually terminate naturally
	defer release()
	switch task {
	case "migrate":
		if len(args) != 1 {
			log.Print(ctx, "Usage: migrate <gameID>")
			os.Exit(1)
		}
		gameID := args[0]
		if ok, err := game.Exists(ctx, client, gameID); !ok || err != nil {
			log.Printf(ctx, "Game %v does not exist (%v)", args[0], err)
			os.Exit(1)
		}
		if err := handleGameMigrationTask(ctx, client, gameID); err != nil {
			log.Printf(ctx, "Error with task: %v", err)
			os.Exit(1)
		}
		break
	default:
		log.Printf(ctx, "No task %v found", task)
		os.Exit(1)
	}
	log.Print(ctx, "Task finished successfully.")
	os.Exit(0)
}
