package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"net/http"
	"time"

	"sr"
	"sr/config"
	"sr/log"
	srOtel "sr/otel"
	redisUtil "sr/redis"
	"sr/roll"
	"sr/routes"
	"sr/setup"
	"sr/shutdown"
	"sr/task"

	"go.opentelemetry.io/otel/trace"
)

// SHADOWROLLER ascii art from  http://www.patorjk.com/software/taag/ "Small Slant"
const SHADOWROLLER = `
   ____ __            __                         __ __
  / __// /  ___ _ ___/ /___  _    __ ____ ___   / // /___  ____
 _\ \ / _ \/ _ '// _  // _ \| |/|/ // __// _ \ / // // -_)/ __/
/___//_//_/\_._/ \___/ \___/|__.__//_/   \___//_//_/ \__//_/
`

var taskFlag = flag.String("task", "", "Select a task to run interactively")

func runServer(ctx context.Context, name string, server *http.Server, tls bool) {
	name = fmt.Sprintf("server %v", name)
	ctx, serverSpan := srOtel.Tracer.Start(ctx, name,
		trace.WithSpanKind(trace.SpanKindInternal),
	)
	defer serverSpan.End()
	shutdownCtx, release := shutdown.Registerf(context.Background(), name)
	log.Printf(ctx, "Running %v server at %v...", name, server.Addr)

	go func() {
		// Wait for interrupt
		<-shutdownCtx.Done()
		defer release()
		ctx, cancel := context.WithTimeout(context.Background(), time.Duration(10)*time.Second)
		defer cancel()
		err := server.Shutdown(ctx)
		if err != nil {
			log.Printf(ctx, "%v server closed: %v", name, err)
		}
	}()

	for {
		var err error
		if tls {
			var pemFile, keyFile string
			if len(config.TLSCertFiles) != 2 {
				pemFile = ""
				keyFile = ""
				log.Print(ctx, "TLS server with autocert started")
			} else {
				pemFile = config.TLSCertFiles[0]
				keyFile = config.TLSCertFiles[1]
				log.Printf(ctx,
					"TLS server with cert files %v, %v started",
					pemFile, keyFile,
				)
			}
			err = server.ListenAndServeTLS(pemFile, keyFile)
		} else {
			log.Print(ctx, "HTTP (unencrypted) server started.")
			err = server.ListenAndServe()
		}

		if errors.Is(err, http.ErrServerClosed) {
			log.Printf(ctx, "%v server has shut down.", name)
			return
		}

		if err != nil {
			log.Printf(ctx, "%v server failed! Restarting in 10s: %v", name, err)
			time.Sleep(time.Duration(10) * time.Second)
			log.Printf(ctx, "%v server restarting.", name)
		}
	}
}

func main() {
	ctx := context.Background()
	shutdown.Start(ctx)
	srOtel.Setup(ctx)
	ctx, mainSpan := srOtel.Tracer.Start(ctx, "main",
		trace.WithSpanKind(trace.SpanKindServer),
	)
	defer mainSpan.End()
	log.Print(ctx, "Starting up...")
	flag.Parse()
	config.VerifyConfig()
	redisUtil.SetupWithConfig()
	if taskFlag != nil && *taskFlag != "" {
		task.RunSelectedTask(ctx, redisUtil.Client, *taskFlag, flag.Args())
	}

	sr.SeedRand()
	roll.Init()
	defer roll.Shutdown()

	{
		ctx, release := shutdown.Register(ctx, "setup")
		setup.CheckGamesAndPlayers(ctx, redisUtil.Client)
		release()
	}

	routes.RegisterTasksViaConfig()

	log.Stdoutf(ctx, "Shadowroller: %v\n", SHADOWROLLER)
	err := routes.DisplaySiteRoutes()
	if err != nil {
		panic(fmt.Sprintf("Unable to walk routes: %v", err))
	}

	if config.RedirectListenHTTP != "" {
		redirectServer := routes.MakeHTTPRedirectServer()
		go runServer(ctx, "redirect", redirectServer, false)
	}

	if config.MainListenHTTP != "" {
		siteServer := routes.MakeHTTPSiteServer()
		runServer(ctx, "main", siteServer, false)
	} else {
		siteServer := routes.MakeHTTPSSiteServer()
		runServer(ctx, "main", siteServer, true)
	}
	// Wait for all handlers to finish and return cleanly
	shutdown.WaitGroup.Wait()
	log.Stdout(ctx, "Shadowroller out.")
}
