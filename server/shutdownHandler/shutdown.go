package shutdownHandler

import (
	"context"
	"log"
	"os"
	"os/signal"
	"sr/config"
	"sync"
	"sync/atomic"
	"syscall"
)

type Reason int32

const StillRunning Reason = 0
const Interrupt Reason = 1

type Release func()

var Channel chan struct{}

var Cause Reason = StillRunning

var WaitGroup = new(sync.WaitGroup)

var id *int32 = new(int32)

var events = make(chan interface{})

func newID() int32 {
	return atomic.AddInt32(id, 1)
}

type client struct {
	id     int32
	name   string
	cancel context.CancelFunc
}

type removeClient struct {
	id int32
}

type shutdown struct {
	reason Reason
}

func handleShutdownTask() {
	var clients = make(map[int32]client)
	terminating := false
	// make tracer for shutdown task
	sigint := make(chan os.Signal, 2)
	signal.Notify(sigint, os.Interrupt, syscall.SIGTERM, syscall.SIGQUIT)
	go func() {
		<-sigint
		events <- shutdown{reason: Interrupt}
	}()
	Channel = make(chan struct{})
	WaitGroup.Add(1)
	if config.ShutdownHandlersDebug {
		log.Printf("shutdown: task started")
	}

	for event := range events {
		switch event.(type) {
		case client: // New client
			client := event.(client)
			if config.ShutdownHandlersDebug {
				log.Printf("shutdown: new client %v %v", client.id, client.name)
			}
			// Client was added after shutdown, send terminate but still track
			if terminating {
				if config.ShutdownHandlersDebug {
					log.Printf("shutdown: immediate cancel of %v", client.id)
				}
				client.cancel()
			}
			clients[client.id] = client
			WaitGroup.Add(1)
		case removeClient:
			remove := event.(removeClient)
			if config.ShutdownHandlersDebug {
				log.Printf("shutdown: removing client %v", remove.id)
			}
			delete(clients, remove.id)
			WaitGroup.Done()
		case shutdown:
			shutdown := event.(shutdown)
			if config.ShutdownHandlersDebug {
				log.Printf("shutdown: interrupt received")
			}
			terminating = true
			Cause = shutdown.reason
			close(Channel)
			WaitGroup.Done() // If we have no clients, main can stop now
			for _, client := range clients {
				log.Printf("shutdown: cancel client %v %v", client.id, client.name)
				client.cancel()
			}
		}
	}
}

func Start() {
	go handleShutdownTask()
}

func Register(ctx context.Context, name string) (context.Context, Release) {
	if config.ShutdownHandlersDebug {
		log.Printf("shutdown: creating %v", name)
	}
	id := newID()
	ctx, cancel := context.WithCancel(ctx)
	release := func() {
		if config.ShutdownHandlersDebug {
			log.Printf("shutdown: client %v %v releasing", id, name)
		}
		cancel() // Also cancel the context in case, extra cleanup is recommended
		events <- removeClient{id}
	}
	events <- client{id, name, cancel}
	return ctx, release
}
