package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"sr"
	"sr/config"
	srOtel "sr/otel"
	redisUtil "sr/redis"
	"sr/roll"
	"sr/routes"
	"sr/setup"
	"sr/shutdownHandler"
	"sr/task"
)

// SHADOWROLLER ascii art from  http://www.patorjk.com/software/taag/ "Small Slant"
const SHADOWROLLER = `
   ____ __            __                         __ __
  / __// /  ___ _ ___/ /___  _    __ ____ ___   / // /___  ____
 _\ \ / _ \/ _ '// _  // _ \| |/|/ // __// _ \ / // // -_)/ __/
/___//_//_/\_._/ \___/ \___/|__.__//_/   \___//_//_/ \__//_/
`

var taskFlag = flag.String("task", "", "Select a task to run interactively")

func runServer(name string, server *http.Server, tls bool) {
	log.Printf("Running %v server at %v...", name, server.Addr)

	go func() {
		shutdownCtx, release := shutdownHandler.Register(context.Background(), fmt.Sprintf("%v server", name))
		defer release()

		// Wait for interrupt
		<-shutdownCtx.Done()
		ctx, cancel := context.WithCancel(context.Background())
		// Timeout terminate server in 10s
		go func() {
			time.Sleep(10 * time.Second)
			cancel()
		}()
		err := server.Shutdown(ctx)
		if err != nil {
			log.Printf("%v server closed: %v", name, err)
		}
	}()

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
			log.Print("HTTP (unencrypted) server started.")
			err = server.ListenAndServe()
		}

		if errors.Is(err, http.ErrServerClosed) {
			log.Printf("%v server has shut down.", name)
			return
		}

		if err != nil {
			log.Print(name, " server failed! Restarting in 10s.", err)
			time.Sleep(time.Duration(10) * time.Second)
			log.Print(name, " server restarting.")
		}
	}
}

func main() {
	ctx := context.Background()
	log.SetOutput(os.Stdout)
	if config.IsProduction {
		// You may want to set UTC logs here
		log.SetFlags(log.Ldate | log.Ltime)
	} else {
		log.SetFlags(log.Ltime | log.Lshortfile)
	}
	shutdown := srOtel.Setup(ctx)
	defer func() {
		err := shutdown(ctx)
		if err != nil {
			log.Printf("otel shutdown error: %v", err)
		}
	}()
	flag.Parse()
	config.VerifyConfig()
	shutdownHandler.Start()
	redisUtil.SetupWithConfig()
	if taskFlag != nil && *taskFlag != "" {
		task.RunSelectedTask(ctx, redisUtil.Client, *taskFlag, flag.Args())
	}

	log.Print("Starting up...")
	sr.SeedRand()
	roll.Init()
	defer roll.Shutdown()
	ctx, release := shutdownHandler.Register(ctx, "setup")
	log.Print("Shutdown registered")
	setup.CheckGamesAndPlayers(ctx, redisUtil.Client)
	release()
	routes.RegisterTasksViaConfig()

	log.Print("Shadowroller:", SHADOWROLLER, "\n")
	err := routes.DisplaySiteRoutes()
	if err != nil {
		panic(fmt.Sprintf("Unable to walk routes: %v", err))
	}

	if config.RedirectListenHTTP != "" {
		redirectServer := routes.MakeHTTPRedirectServer()
		go runServer("redirect", redirectServer, false)
	}

	if config.MainListenHTTP != "" {
		siteServer := routes.MakeHTTPSiteServer()
		runServer("main", siteServer, false)
	} else {
		siteServer := routes.MakeHTTPSSiteServer()
		runServer("main", siteServer, true)
	}
	// Wait for all handlers to finish and return cleanly
	shutdownHandler.WaitGroup.Wait()
	log.Print("Shadowroller out.")
}
