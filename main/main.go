package main

import (
	"log"
	"os"
	"srserver"
	"srserver/config"
	"time"
)

func main() {
	log.SetOutput(os.Stdout)
	if config.IsProduction {
		log.SetFlags(
			log.Ldate | log.Ltime | log.LUTC | log.Lmicroseconds | log.Llongfile,
		)
	} else {
		log.SetFlags(log.Ltime | log.Lshortfile)
	}
	log.Println("Starting up...")

	srserver.BeginGeneratingRolls()
	srserver.RegisterDefaultGames()

	siteMux := srserver.MakeServerMux()

	// Run http->https and main servers in loops.
	if config.IsProduction {
		log.Println("\n\n",
			"* Running in development *\n",
			"* At: ", config.ServerAddress, " *\n")
		certManager := srserver.MakeCertManager()
		redirectServer := srserver.MakeHttpRedirectServer(certManager)
		mainServer := srserver.MakeProductionServer(certManager, siteMux)

		// Loop the main server in a goroutine.
		go func() {
			log.Println("Starting production site server.")
			for {
				err := mainServer.ListenAndServeTLS("", "")
				if err != nil {
					log.Println("Production site server failed!", err)
					log.Println("Waiting before restarting site...")
					time.Sleep(time.Duration(10) * time.Second)
					log.Println("Restarting production server.")
				}
			}
		}()

		// Loop the redirect server in this thread.
		log.Println("Starting production redirect server...")
		for {
			err := redirectServer.ListenAndServe()
			if err != nil {
				log.Println("Production redirect server failed!", err)
				log.Println("Waiting before restarting redirect...")
				time.Sleep(time.Duration(8) * time.Second)
				log.Println("Restarting redirect server.")
			}
		}
	} else {
		log.Println("\n\n",
			"* Running in development *\n",
			"* At: ", config.ServerAddress, " *\n")
		// Run the local server unlooped in this thread.
		mainServer := srserver.MakeLocalServer(siteMux)
		log.Println("- Development server created.")

		log.Println("Starting development site server...")
		err := mainServer.ListenAndServe()
		if err != nil {
			log.Println("Development server error:", err)
			os.Exit(1)
		}
	}
}
