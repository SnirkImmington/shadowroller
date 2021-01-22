package task

import (
	"log"
	"os"
	"sr/game"
	redisUtil "sr/redis"
)

// PrintAvailableTasks prints the list of CLI tasks
func PrintAvailableTasks() {
	tasks := []string{"migrate"}
	log.Printf("Available tasks:\n\t%v", tasks)
}

// RunSelectedTask runs the passed in task from the command line
func RunSelectedTask(task string, args []string) {
	log.Printf("Run task %v %v", task, args)
	switch task {
	case "migrate":
		if len(args) != 1 {
			log.Printf("Usage: migrate <gameID>")
			os.Exit(1)
		}
		gameID := args[0]
		conn := redisUtil.Connect()
		defer redisUtil.Close(conn)
		if ok, err := game.Exists(gameID, conn); !ok || err != nil {
			log.Printf("Game %v does not exist (%v)", args[0], err)
			os.Exit(1)
		}
		if err := handleGameMigrationTask(gameID, conn); err != nil {
			log.Printf("Error with task: %v", err)
			os.Exit(1)
		}

		log.Printf("Task finished successfully.")
		os.Exit(0)
	}
}
