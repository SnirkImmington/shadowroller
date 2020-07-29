package routes

import (
	"crypto/tls"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"golang.org/x/crypto/acme/autocert"
	"log"
	"net/http"
	"sr/config"
	"strings"
	"time"
)

var restRouter = BaseRouter()

// BaseRouter produces a router which
func BaseRouter() *mux.Router {
	router := mux.NewRouter()
	router.Use(
		mux.MiddlewareFunc(requestIDMiddleware),
		mux.MiddlewareFunc(recoveryMiddleware),
		mux.MiddlewareFunc(rateLimitedMiddleware),
		mux.MiddlewareFunc(headersMiddleware),
	)
    if config.SlowResponsesDebug {
        router.Use(mux.MiddlewareFunc(slowResponsesMiddleware))
    }
	//router.NotFoundHandler = http.HandlerFunc(notFoundHandler)
	return router
}

func notFoundHandler(response Response, request *Request) {
	logRequest(request)
	http.Error(response, "Not Found", http.StatusNotFound)
	logf(request, ">> 404 Not Found")
}

func displayRoute(route *mux.Route, handler *mux.Router, parents []*mux.Route) error {
	indentation := strings.Repeat("  ", len(parents))
	endpoint, err := route.GetPathTemplate()
	if err != nil {
		endpoint = "[default]"
	}
	methods, err := route.GetMethods()
	if err != nil { // it's a top level thing
		fmt.Println(indentation, endpoint)
	} else {
		fmt.Println(indentation, endpoint, methods)
	}
	return nil
}

func DisplaySiteRoutes() error {
	err := restRouter.Walk(displayRoute)
	fmt.Println(" [default] [*]\n")
	return err
}

/*
   Let's Encrypt TLS server inspired by:
   https://blog.kowalczyk.info/article/Jl3G/https-for-free-in-go-with-little-help-of-lets-encrypt.html
   Gist: https://github.com/kjk/go-cookbook/blob/master/free-ssl-certificates/main.go


   TLS hardening options copied from:
   https://blog.cloudflare.com/exposing-go-on-the-internet/

*/

var certManager = autocert.Manager{
	Prompt:     autocert.AcceptTOS,
	HostPolicy: autocert.HostWhitelist(config.TLSHostname),
	Cache:      autocert.DirCache(config.CertDir),
}

func MakeHTTPRedirectServer() http.Server {
	router := mux.NewRouter()
	router.Use(requestIDMiddleware)
	router.Use(recoveryMiddleware)
	router.Use(rateLimitedMiddleware)
	// no headers or not found handler
	router.HandleFunc("/", func(response Response, request *Request) {
		logf(request, "<< HTTP %v %v %v %v",
			request.RemoteAddr, request.Proto, request.Method, request.URL,
		)
		newURL := "https://" + config.TLSHostname + request.URL.String()
		http.Redirect(response, request, newURL, http.StatusMovedPermanently)
		logf(request, ">> 308 HTTPS %v", request.URL)
	})

	server := makeServerFromRouter(router)
	server.Handler = certManager.HTTPHandler(server.Handler)
	server.Addr = config.HostHTTP
	return server
}

func MakeHTTPSiteServer() http.Server {
	if config.IsProduction {
		panic("Attempted to make a site local server in production!")
	}
	c := cors.New(cors.Options{
		AllowOriginFunc: func(origin string) bool {
			if config.CORSDebug {
				log.Print("Accepting CORS origin ", origin)
			}
			return true
		},
		AllowedHeaders:   []string{"Authentication", "Content-Type"},
		AllowCredentials: true,
		Debug:            config.CORSDebug,
	})
	restRouter.NewRoute().HandlerFunc(notFoundHandler)
	router := c.Handler(restRouter)
	server := makeServerFromRouter(router)
	server.Addr = config.HostAddress
	return server
}

func MakeHTTPSSiteServer() http.Server {
	tlsConfig := tls.Config{
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
		AllowedOrigins:   []string{config.FrontendAddress, "https://" + config.TLSHostname},
		AllowCredentials: true,
		AllowedHeaders:   []string{"Authentication", "Content-Type"},
		Debug:            config.CORSDebug,
	})
	restRouter.NewRoute().HandlerFunc(notFoundHandler)
	router := c.Handler(restRouter)
	server := makeServerFromRouter(router)
	server.TLSConfig = &tlsConfig
	server.Addr = config.HostHTTPS
	return server
}

func makeServerFromRouter(router http.Handler) http.Server {
	return http.Server{
		ReadTimeout: time.Duration(config.ReadTimeoutSecs) * time.Second,
		//WriteTimeout:   time.Duration(config.WriteTimeoutSecs) * time.Second,
		IdleTimeout:    time.Duration(config.IdleTimeoutSecs) * time.Second,
		MaxHeaderBytes: config.MaxHeaderBytes,
		Handler:        router,
	}
}
