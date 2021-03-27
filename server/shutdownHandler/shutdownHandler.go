package shutdownHandler

import (
	"log"
	"os"
	"os/signal"
	"sr/config"
	"sync"
)

type ShutdownReason int

const ShutdownInterrupt ShutdownReason = 0

type Client struct {
	ID      string
	Channel chan ShutdownReason
}

// WaitGroup is `Wait()`ed on in the main() thread.
var WaitGroup = new(sync.WaitGroup)

var clientChannel = make(chan *Client)

func MakeClient(id string) *Client {
	client := &Client{
		ID:      id,
		Channel: make(chan ShutdownReason),
	}
	clientChannel <- client
	return client
}

func (c *Client) Close() {
	clientChannel <- c
	close(c.Channel)
}

func handleShutdown() {
	sigint := make(chan os.Signal, 2)
	signal.Notify(sigint, os.Interrupt)
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
			}
		}
	}
}

func Init() {
	go handleShutdown()
}
