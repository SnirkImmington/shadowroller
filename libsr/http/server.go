package http

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	netHTTP "net/http"
	"time"

	"shadowroller.net/libsr/config"
	"shadowroller.net/libsr/log"
	srOtel "shadowroller.net/libsr/otel"
	"shadowroller.net/libsr/shutdown"

	"go.opentelemetry.io/otel/trace"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"golang.org/x/crypto/acme/autocert"
)

func RunServer(ctx context.Context, name string, server *netHTTP.Server, tls bool) {
	name = fmt.Sprintf("server %v", name)
	ctx, serverSpan := srOtel.Tracer.Start(ctx, name,
		trace.WithSpanKind(trace.SpanKindServer),
	)
	logger := srOtel.MakeLogger(ctx)
	server.ErrorLog = logger
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

		if errors.Is(err, netHTTP.ErrServerClosed) {
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

func makeCORSConfig() *cors.Cors {
	var c *cors.Cors
	if config.IsProduction || !config.DisableCORS {
		c = cors.New(cors.Options{
			AllowedOrigins: []string{
				config.FrontendOrigin.String(),
				config.BackendOrigin.String(),
			},
			AllowedHeaders:   []string{"Authentication", "Content-Type"},
			AllowCredentials: true,
			Debug:            config.CORSDebug,
		})
	} else {
		c = cors.New(cors.Options{
			AllowOriginFunc: func(origin string) bool {
				if config.CORSDebug {
					log.Printf(context.Background(), "Accepting CORS origin %v", origin)
				}
				return true
			},
			AllowedHeaders:   []string{"Authentication", "Content-Type"},
			AllowCredentials: true,
			Debug:            config.CORSDebug,
		})
	}
	return c
}

//
// TLS Config
//

// certManager is used when Let's Encrypt is enabled.
var certManager = autocert.Manager{
	Prompt:     autocert.AcceptTOS,
	HostPolicy: autocert.HostWhitelist(config.BackendOrigin.Host),
	Cache:      autocert.DirCache(config.TLSAutocertDir),
}

func baseTLSConfig() *tls.Config {
	return &tls.Config{
		PreferServerCipherSuites: true,
		CurvePreferences: []tls.CurveID{
			tls.CurveP256,
			tls.X25519,
		},
		MinVersion: tls.VersionTLS12,
		CipherSuites: []uint16{
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
			tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
		},
	}
}

func autocertTLSConfig() *tls.Config {
	conf := baseTLSConfig()
	conf.GetCertificate = certManager.GetCertificate
	return conf
}

//
// Servers
//

// MakeHTTPRedirectServer makes the redirect server
func MakeHTTPRedirectServer(redirectRouter *mux.Router) *netHTTP.Server {
	server := makeServerFromRouter(redirectRouter)
	if config.TLSAutocertDir != "" {
		server.Handler = certManager.HTTPHandler(server.Handler)
	}
	server.Addr = config.RedirectListenHTTP
	return server
}

// MakeHTTPSiteServer makes the HTTP (unencrypted) site server
func MakeHTTPSiteServer(mainRouter *mux.Router) *netHTTP.Server {
	c := makeCORSConfig()
	router := c.Handler(mainRouter)
	server := makeServerFromRouter(router)
	server.Addr = config.MainListenHTTP
	return server
}

// MakeHTTPSSiteServer makes the HTTPS site server
func MakeHTTPSSiteServer(mainRouter *mux.Router) *netHTTP.Server {
	var tlsConf *tls.Config
	if config.TLSAutocertDir != "" {
		tlsConf = autocertTLSConfig()
	} else {
		tlsConf = baseTLSConfig()
	}
	c := makeCORSConfig()
	mainRouter.Use(TLSHeadersMiddleware)
	router := c.Handler(mainRouter)
	server := makeServerFromRouter(router)
	server.TLSConfig = tlsConf
	server.Addr = config.MainListenHTTPS
	return server
}

func makeServerFromRouter(router netHTTP.Handler) *netHTTP.Server {
	return &netHTTP.Server{
		ReadTimeout: time.Duration(config.ReadTimeoutSecs) * time.Second,
		//WriteTimeout:   time.Duration(config.WriteTimeoutSecs) * time.Second,
		IdleTimeout:    time.Duration(config.IdleTimeoutSecs) * time.Second,
		MaxHeaderBytes: config.MaxHeaderBytes,
		Handler:        router,
	}
}
