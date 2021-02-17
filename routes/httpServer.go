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

//
// HTTP Routers
//

var restRouter = apiRouter()

// BaseRouter produces a router for the API
func BaseRouter() *mux.Router {
	router := mux.NewRouter()
	router.Use(
		mux.MiddlewareFunc(requestContextMiddleware),
		mux.MiddlewareFunc(recoveryMiddleware),
		mux.MiddlewareFunc(rateLimitedMiddleware),
	)
	if config.SlowResponsesDebug {
		router.Use(mux.MiddlewareFunc(slowResponsesMiddleware))
	}
	return router
}

func apiRouter() *mux.Router {
	router := BaseRouter()
	router.Use(mux.MiddlewareFunc(headersMiddleware))
	router.NotFoundHandler = http.HandlerFunc(notFoundHandler)
	return router
}

func redirectRouter() *mux.Router {
	router := BaseRouter()
	router.HandleFunc("/", func(response Response, request *Request) {
		logf(request, "<< HTTP %v %v %v %v",
			request.RemoteAddr, request.Proto, request.Method, request.URL,
		)
		newURL := "https://" + config.TLSHostname + request.URL.String()
		http.Redirect(response, request, newURL, http.StatusMovedPermanently)
		dur := displayRequestDuration(request.Context())
		logf(request, ">> 308 %v (%v)", newURL, dur)
	})
	return router
}

func notFoundHandler(response Response, request *Request) {
	logRequest(request)
	http.Error(response, "Not Found", http.StatusNotFound)
	dur := displayRequestDuration(request.Context())
	logf(request, ">> 404 Not Found (%v)", dur)
}

func makeCORSConfig() *cors.Cors {
	var c *cors.Cors
	if config.IsProduction {
		c = cors.New(cors.Options{
			AllowedOrigins: []string{
				config.FrontendDomain,
				"https://" + config.TLSHostname,
			},
			AllowedHeaders:   []string{"Authentication", "Content-Type"},
			AllowCredentials: true,
			Debug:            config.CORSDebug,
		})
	} else {
		c = cors.New(cors.Options{
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
	}
	return c
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
	fmt.Println(" [default] [*]")
	fmt.Println()
	return err
}

//
// TLS Config
//

// certManager is used when Let's Encrypt is enabled.
var certManager = autocert.Manager{
	Prompt:     autocert.AcceptTOS,
	HostPolicy: autocert.HostWhitelist(config.TLSHostname),
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

func MakeHTTPRedirectServer() *http.Server {
	router := redirectRouter()
	server := makeServerFromRouter(router)
	if config.TLSAutocertDir != "" {
		server.Handler = certManager.HTTPHandler(server.Handler)
	}
	server.Addr = config.PublishRedirect
	return server
}

func MakeHTTPSiteServer() *http.Server {
	c := makeCORSConfig()
	restRouter.NewRoute().HandlerFunc(notFoundHandler)
	router := c.Handler(restRouter)
	server := makeServerFromRouter(router)
	server.Addr = config.PublishHTTP
	return server
}

func MakeHTTPSSiteServer() *http.Server {
	var tlsConf *tls.Config
	if config.TLSAutocertDir != "" {
		tlsConf = autocertTLSConfig()
	} else {
		tlsConf = baseTLSConfig()
	}
	c := makeCORSConfig()
	restRouter.NewRoute().HandlerFunc(notFoundHandler)
	restRouter.Use(tlsHeadersMiddleware)
	router := c.Handler(restRouter)
	server := makeServerFromRouter(router)
	server.TLSConfig = tlsConf
	server.Addr = config.PublishHTTPS
	return server
}

func makeServerFromRouter(router http.Handler) *http.Server {
	return &http.Server{
		ReadTimeout: time.Duration(config.ReadTimeoutSecs) * time.Second,
		//WriteTimeout:   time.Duration(config.WriteTimeoutSecs) * time.Second,
		IdleTimeout:    time.Duration(config.IdleTimeoutSecs) * time.Second,
		MaxHeaderBytes: config.MaxHeaderBytes,
		Handler:        router,
	}
}
