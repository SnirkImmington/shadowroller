package shutdownHandler

import (
	"log"
	"os"
	"os/signal"
	"sr/config"
	"sync"
	"syscall"
)

// ShutdownReason is the reason a client should shut down
type ShutdownReason int

const ShutdownInterrupt ShutdownReason = 0 // Server process is being killed

// Client is a running task which the server should wait for before shutting down.
//
// Each client should have some way of _receiving_ the notification from the server
// to shut down, via a `context.Context`. The Client represents _sending_ the
// notification to the server to shut down.
//
// These systems are used:
//
// Process      | Notify of startup     | Receive shutdown                    |
// -------------|-----------------------|-------------------------------------|
// REST server  | Create client on init | Call to Shutdown(ctx)               |
// REST handler | ^paired to server     | ^prop via request ctx               |
// REST helper  | Own client ID         | ^prop via server's or caller's ctx  |
// HTTP task    | Own client ID         | *Terminate on its own*              |
// Queue reader | Own client ID         | Shutdown method with cancel context |
type Client struct {
	ID      string              // Unique ID for the client
	once    sync.Once           // Call the close once
	Channel chan ShutdownReason // Channel to receive a shutdown message from
}

// WaitGroup is `Wait()`ed on in the main() thread.
var WaitGroup = new(sync.WaitGroup)

// clientChannel receives references to clients, which it uses to add or remove
// tasks from the shutdown handler
var clientChannel = make(chan *Client)

// MakeClient produces a new `shutdownHandler.Client` with the given ID which will
// cause the interrupt handler to wait for this task to run. `client.Close()` must
// be called or the resource will leak.
func MakeClient(id string) *Client {
	client := &Client{
		ID:      id,
		Channel: make(chan ShutdownReason),
	}
	clientChannel <- client
	return client
}

// Close allows the server to shut down if no other clients are open.
func (c *Client) Close() {
	if config.ShutdownHandlersDebug {
		log.Printf("Client %v Close()", c.ID)
	}
	c.once.Do(func() {
		if config.ShutdownHandlersDebug {
			log.Printf("Client %v closing", c.ID)
		}
		clientChannel <- c
	})
}

func handleShutdown() {
	sigint := make(chan os.Signal, 2)
	signal.Notify(sigint,
		os.Interrupt, // Compatibility
		// In running tests on Linux, I've found that reflex will send a signal `os.Interrupt`
		// will handle, but ^C-ing in Bash will not cause the signal to be handled.
		syscall.SIGINT,
		syscall.SIGQUIT,
		syscall.SIGTERM,
	)
	clients := make(map[*Client]bool)
	sigintReceived := false
	// WaitGroup starts at 1 beacuse we're waiting for an interrupt.
	WaitGroup.Add(1)

	if config.ShutdownHandlersDebug {
		log.Print("Shutdown handler routine started.")
	}
	for {
		select {
		case client := <-clientChannel:
			if _, found := clients[client]; found {
				if config.ShutdownHandlersDebug {
					log.Printf("(%v) Removing %v", len(clients)-1, client.ID)
				}
				delete(clients, client)
				WaitGroup.Done()
			} else {
				if sigintReceived {
					if config.ShutdownHandlersDebug {
						log.Printf("Received %v after sigint", client.ID)
					}
					client.Channel <- ShutdownInterrupt
					close(client.Channel)
				}
				if config.ShutdownHandlersDebug {
					log.Printf("(%v) Adding %v", len(clients)+1, client.ID)
				}
				WaitGroup.Add(1)
				clients[client] = true
			}
		case <-sigint:
			if sigintReceived {
				log.Print("Aborting...")
				os.Exit(1)
			}
			if config.ShutdownHandlersDebug && len(clients) == 0 {
				log.Print("No clients are currently registered")
			}
			log.Print("Shutting down... (ctrl+C to force)")
			WaitGroup.Done() // If there are no clients, this will begin exiting
			sigintReceived = true
			for client := range clients {
				if config.ShutdownHandlersDebug {
					log.Printf("- Sent shutdown to %v", client.ID)
				}
				client.Channel <- ShutdownInterrupt
				close(client.Channel)
			}
		}
	}
}

// Init starts the shutdown handler in a separate goroutine.
func Init() {
	go handleShutdown()
}
