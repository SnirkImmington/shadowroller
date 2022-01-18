package main

import (
	"context"
	"flag"
	"fmt"

	"shadowroller.net/libsr"
	"shadowroller.net/libsr/config"
	srHTTP "sr/http"
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

func main() {
	ctx := context.Background()
	shutdown.Start(ctx)
	srOtel.Setup(ctx)
	ctx, mainSpan := srOtel.Tracer.Start(ctx, "main",
		trace.WithSpanKind(trace.SpanKindServer),
	)
	defer mainSpan.End()
	log.Stdout(ctx, "Starting up...")
	flag.Parse()
	config.VerifyConfig()
	redisUtil.SetupWithConfig()
	if taskFlag != nil && *taskFlag != "" {
		task.RunSelectedTask(ctx, redisUtil.Client, *taskFlag, flag.Args())
	}

	sr.SeedRand(ctx)
	roll.Init(ctx)

	{
		ctx, release := shutdown.Register(ctx, "setup")
		setup.CheckGamesAndPlayers(ctx, redisUtil.Client)
		release()
	}

	routes.RegisterTasksViaConfig()

	log.Stdoutf(ctx, "Shadowroller: %v", SHADOWROLLER)
	err := routes.DisplaySiteRoutes(ctx)
	if err != nil {
		panic(fmt.Sprintf("Unable to walk routes: %v", err))
	}

	if config.RedirectListenHTTP != "" {
		redirectServer := srHTTP.MakeHTTPRedirectServer(routes.MakeRedirectRouter())
		go srHTTP.RunServer(ctx, "redirect", redirectServer, false)
	}

	if config.MainListenHTTP != "" {
		siteServer := srHTTP.MakeHTTPSiteServer(routes.MakeMainRouter())
		srHTTP.RunServer(ctx, "main", siteServer, false)
	} else {
		siteServer := srHTTP.MakeHTTPSSiteServer(routes.MakeMainRouter())
		srHTTP.RunServer(ctx, "main", siteServer, true)
	}
	// Wait for all handlers to finish and return cleanly
	shutdown.WaitGroup.Wait()
	defer log.Stdout(ctx, "Shadowroller out.")
}
