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
			var pemFile, keyFile string
			if len(config.TLSCertFiles) != 2 {
				pemFile = ""
				keyFile = ""
				log.Print("TLS server with autocert started.")
			} else {
				pemFile = config.TLSCertFiles[0]
				keyFile = config.TLSCertFiles[1]
				log.Print(
					"TLS server with cert files ", pemFile, ", ",
					keyFile, " started.",
				)
			}
			err = server.ListenAndServeTLS(pemFile, keyFile)
		} else {
			log.Print("HTTP server started.")
			err = server.ListenAndServe()
		}

		if err != nil {
			log.Print(name, " server failed! Restarting in 10s.", err)
			time.Sleep(time.Duration(10) * time.Second)
			log.Print(name, " server restarting.")
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
	routes.RegisterTasksViaConfig()

	log.Print("Shadowroller:", SHADOWROLLER, "\n")

	err := routes.DisplaySiteRoutes()
	if err != nil {
		panic(fmt.Sprintf("Unable to walk routes: %v", err))
	}

	log.Print(config.HardcodedGameNames)

	if config.PublishRedirect != "" {
		redirectServer := routes.MakeHTTPRedirectServer()
		go runServer("redirect", redirectServer, false)
	}

	if config.PublishHTTP != "" {
		siteServer := routes.MakeHTTPSiteServer()
		runServer("API", siteServer, false)
	} else {
		siteServer := routes.MakeHTTPSSiteServer()
		runServer("API", siteServer, true)
	}
}
