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

var restRouter = makeAPIRouter()

// BaseRouter produces a router for the API
func makeBaseRouter() *mux.Router {
	router := mux.NewRouter()
	router.Use(
		mux.MiddlewareFunc(requestContextMiddleware),
		mux.MiddlewareFunc(recoveryMiddleware),
		mux.MiddlewareFunc(rateLimitedMiddleware),
		mux.MiddlewareFunc(universalHeadersMiddleware),
	)
	if config.SlowResponsesDebug {
		router.Use(mux.MiddlewareFunc(slowResponsesMiddleware))
	}
	return router
}

func makeAPIRouter() *mux.Router {
	router := mux.NewRouter()
	router.Use(mux.MiddlewareFunc(restHeadersMiddleware))
	// This is a requirement for use of PathPrefix, it's pretty annoying
	if config.HostFrontend == "subroute" {
		router = router.PathPrefix("/api").Subrouter()
	}
	return router
}

func makeFrontendRouter() *mux.Router {
	router := mux.NewRouter()
	// router.Use(
	//     // No frontend middleware
	// )
	router.PathPrefix("/static").HandlerFunc(handleFrontendStatic).Methods("GET")
	router.NewRoute().Name("/").HandlerFunc(handleFrontendBase).Methods("GET")
	return router
}

func makeTasksRouter() *mux.Router {
	router := mux.NewRouter()
	return router.PathPrefix("/task").Subrouter()
}

var shouldNotBeCalledHandler = http.HandlerFunc(func(response Response, request *Request) {
	logRequest(request)
	logf(request, "Default handler called!")
	httpInternalError(response, request, "Default handler called")
})

func makeMainRouter() *mux.Router {
	base := makeBaseRouter()
	base.NotFoundHandler = shouldNotBeCalledHandler
	switch config.HostFrontend {
	case "":
		restRouter.HandleFunc("/", handleRoot).Name("(Unhelpful)").Methods("GET")
		base.NewRoute().Name("Backend").Handler(restRouter)
		return base
	case "redirect":
		restRouter.HandleFunc("/", handleFrontendRedirect).Methods("GET")
		base.NewRoute().Name("Backend + redirect").Handler(restRouter)
		return base
	case "by-domain":
		restRouter.HandleFunc("/", handleRoot).Methods("GET")
		base.Host(config.BackendOrigin.Host).Name(config.BackendOrigin.Host).Handler(restRouter)
		base.Host(config.FrontendOrigin.Host).Name(config.FrontendOrigin.Host).Handler(frontendRouter)
		base.NewRoute().Name("[*] [Default Host redirect]").HandlerFunc(handleFrontendRedirect)
		return base
	case "subroute":
		restRouter.HandleFunc("/", handleRoot).Methods("GET")
		base.PathPrefix("/api").Name("Backend").Handler(restRouter)
		base.NewRoute().Name("Frontend").Handler(frontendRouter)
		return base
	default:
		panic("Invalid HOST_FRONTEND option") // should be caught in config validation
	}
}

func makeRedirectRouter() *mux.Router {
	router := makeBaseRouter()
	router.HandleFunc("/", func(response Response, request *Request) {
		logf(request, "<< HTTP %v %v %v %v",
			request.RemoteAddr, request.Proto, request.Method, request.URL,
		)
		newURL := config.BackendOrigin.String() + request.URL.String()
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
					log.Printf("Accepting CORS origin %v", origin)
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
	if config.HostFrontend == "subroute" && endpoint != "/api" {
		endpoint = strings.TrimPrefix(endpoint, "/api")
	}
	if err != nil {
		if route.GetName() != "" {
			endpoint = route.GetName()
		} else {
			// All of the "special" routes should be named.
			log.Printf("Attempting to walk %#v %#v, got %v", route, endpoint, err)
			endpoint = "[default]"
		}
	}
	methods, err := route.GetMethods()
	if err != nil { // it's a top level thing
		fmt.Println(indentation, endpoint)
	} else {
		fmt.Println(indentation, endpoint, methods)
	}
	return nil
}

// DisplaySiteRoutes prints the list of routes the site will handle
func DisplaySiteRoutes() error {
	err := makeMainRouter().Walk(displayRoute)
	if err != nil {
		fmt.Println("Error:", err)
	}
	fmt.Println()
	return err
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
func MakeHTTPRedirectServer() *http.Server {
	router := makeRedirectRouter()
	server := makeServerFromRouter(router)
	if config.TLSAutocertDir != "" {
		server.Handler = certManager.HTTPHandler(server.Handler)
	}
	server.Addr = config.RedirectListenHTTP
	return server
}

// MakeHTTPSiteServer makes the HTTP (unencrypted) site server
func MakeHTTPSiteServer() *http.Server {
	c := makeCORSConfig()
	mainRouter := makeMainRouter()
	router := c.Handler(mainRouter)
	server := makeServerFromRouter(router)
	server.Addr = config.MainListenHTTP
	return server
}

// MakeHTTPSSiteServer makes the HTTPS site server
func MakeHTTPSSiteServer() *http.Server {
	var tlsConf *tls.Config
	if config.TLSAutocertDir != "" {
		tlsConf = autocertTLSConfig()
	} else {
		tlsConf = baseTLSConfig()
	}
	c := makeCORSConfig()
	mainRouter := makeMainRouter()
	mainRouter.Use(tlsHeadersMiddleware)
	router := c.Handler(mainRouter)
	server := makeServerFromRouter(router)
	server.TLSConfig = tlsConf
	server.Addr = config.MainListenHTTPS
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
