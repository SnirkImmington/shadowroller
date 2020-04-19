package srserver

import (
	"context"
	"crypto/tls"
	"fmt"
	"golang.org/x/crypto/acme/autocert"
	//"log"
	"github.com/janberktold/sse"
	"github.com/rs/cors"
	"net/http"
	"srserver/config"
	"time"
)

/*
   Let's Encrypt TLS server inspired by:
   https://blog.kowalczyk.info/article/Jl3G/https-for-free-in-go-with-little-help-of-lets-encrypt.html
   Gist: https://github.com/kjk/go-cookbook/blob/master/free-ssl-certificates/main.go


   TLS hardening options copied from:
   https://blog.cloudflare.com/exposing-go-on-the-internet/

*/

var sseUpgrader = sse.Upgrader{
	RetryTime: time.Duration(config.SSEClientRetrySecs) * time.Second,
}

/*
   Creates an *http.Server using the given routing options.

   This uses config options to make the main local or production server.
   It's also used to make an http server that redirects to https.
*/
func makeServerFromHandler(handler http.Handler) *http.Server {
	return &http.Server{
		ReadTimeout: time.Duration(config.ReadTimeoutSecs) * time.Second,
		//WriteTimeout:   time.Duration(config.WriteTimeoutSecs) * time.Second,
		IdleTimeout:    time.Duration(config.IdleTimeoutSecs) * time.Second,
		MaxHeaderBytes: config.MaxHeaderBytes,
		Handler:        handler,
	}
}

func MakeHttpRedirectServer(certManager *autocert.Manager) *http.Server {
	mux := &http.ServeMux{}
	mux.HandleFunc("/", func(response http.ResponseWriter, request *http.Request) {
		newUrl := "https://" + request.Host + request.URL.String()
		http.Redirect(response, request, newUrl, http.StatusMovedPermanently)
	})
	server := makeServerFromHandler(mux)
	server.Handler = certManager.HTTPHandler(server.Handler)
	server.Addr = ":80"
	return server
}

func MakeLocalServer(mux http.Handler) *http.Server {
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{config.FrontendAddress, config.StagingAddress},
		AllowCredentials: true, // Needed for JWT
	})
	mux = c.Handler(mux)
	server := makeServerFromHandler(mux)
	server.Addr = config.ServerAddress // TODO is this accurate?
	return server
}

func MakeCertManager() *autocert.Manager {
	return &autocert.Manager{
		Prompt: autocert.AcceptTOS,
		HostPolicy: func(ctx context.Context, host string) error {
			if host == config.ServerAddress {
				return nil
			}
			return fmt.Errorf("acme/autocert: only %s is allowed", config.ServerAddress)
		},
		Cache: autocert.DirCache(config.CertDir),
	}
}

func MakeProductionServer(certManager *autocert.Manager, mux http.Handler) *http.Server {
	tlsConfig := &tls.Config{
		PreferServerCipherSuites: true,
		CurvePreferences: []tls.CurveID{
			tls.CurveP256,
			tls.X25519,
		},
		MinVersion: tls.VersionTLS12,
		CipherSuites: []uint16{
			// TODO check if these are supported by the CPU architecture.
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
			tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
		},
		GetCertificate: certManager.GetCertificate,
	}
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{config.FrontendAddress},
		AllowCredentials: true, // Needed for JWT
	})
	mux = c.Handler(mux)
	server := makeServerFromHandler(mux)
	server.TLSConfig = tlsConfig
	server.Addr = ":443"
	return server
}
