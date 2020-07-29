package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"sr"
	"sr/config"
	"sr/routes"
	"time"
)

// SHADOWROLLER ascii art from  http://www.patorjk.com/software/taag/ "Small Slant"
const SHADOWROLLER = `
   ____ __            __                         __ __
  / __// /  ___ _ ___/ /___  _    __ ____ ___   / // /___  ____
 _\ \ / _ \/ _ '// _  // _ \| |/|/ // __// _ \ / // // -_)/ __/
/___//_//_/\_._/ \___/ \___/|__.__//_/   \___//_//_/ \__//_/
`

func runServer(name string, server http.Server, tls bool) {
	log.Print("Running ", name, " server at ", server.Addr, "...")

	for {
		var err error
		if tls {
			err = server.ListenAndServeTLS("", "")
		} else {
			err = server.ListenAndServe()
		}

		if err != nil {
			log.Print(name, ": Server failed! Restarting in 10s.", err)
			time.Sleep(time.Duration(10) * time.Second)
			log.Print(name, ": Restarting.")
		}
	}
}

func main() {
	log.SetOutput(os.Stdout)
	if config.IsProduction {
		log.SetFlags(
			log.Ldate | log.Ltime | log.LUTC | log.Lmicroseconds,
		)
	} else {
		log.SetFlags(log.Ltime | log.Lshortfile)
	}

	log.Print("Starting up...")

	rand.Seed(time.Now().UnixNano())
	sr.BeginGeneratingRolls()
	sr.SetupRedis()
	config.VerifyConfig()

	log.Print("Shadowroller:", SHADOWROLLER, "\n")

	err := routes.DisplaySiteRoutes()
	if err != nil {
		panic(fmt.Sprintf("Unable to walk routes: %v", err))
	}

	log.Print(config.HardcodedGameNames)

	// Run http->https and main servers in loops.
	if config.IsProduction {
		redirectServer := routes.MakeHTTPRedirectServer()
		siteServer := routes.MakeHTTPSSiteServer()

		go runServer("redirects", redirectServer, false)
		runServer("main", siteServer, true)
	} else {
		// Run the local server unlooped in this thread.
		mainServer := routes.MakeHTTPSiteServer()

		log.Print("Running dev server at ", mainServer.Addr, "...")
		err := mainServer.ListenAndServe()
		if err != nil {
			log.Println("Development server error:", err)
			os.Exit(1)
		}
	}
}
