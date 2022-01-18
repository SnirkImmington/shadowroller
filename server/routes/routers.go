package routes

import (
	netHTTP "net/http"

	"shadowroller.net/libsr/config"
	srHTTP "shadowroller.net/libsr/http"
	"sr/log"
	"sr/taskCtx"

	"github.com/gorilla/mux"
)

var RESTRouter = makeAPIRouter()

var FrontendRouter = makeFrontendRouter()

// BaseRouter produces a router for the API
func makeBaseRouter() *mux.Router {
	router := mux.NewRouter()
	router.Use(
		srHTTP.RequestContextMiddleware,
		srHTTP.RecoveryMiddleware,
		srHTTP.HaltMiddleware,
		srHTTP.RateLimitedMiddleware,
		srHTTP.OtelMiddleware,
		//srHTTP.requestShutdownMiddleware,
		srHTTP.UniversalHeadersMiddleware,
	)
	if config.SlowResponsesDebug {
		router.Use(mux.MiddlewareFunc(srHTTP.SlowResponsesMiddleware))
	}
	return router
}

func makeAPIRouter() *mux.Router {
	router := mux.NewRouter()
	router.Use(mux.MiddlewareFunc(srHTTP.RESTHeadersMiddleware))
	// This is a requirement for use of PathPrefix, it's pretty annoying
	if config.HostFrontend == "subroute" {
		router = router.PathPrefix("/api").Subrouter()
	}
	return router
}

func makeFrontendRouter() *mux.Router {
	router := mux.NewRouter()
	router.Use(mux.MiddlewareFunc(srHTTP.FrontendHeadersMiddleware))
	router.PathPrefix("/static").HandlerFunc(handleFrontendStatic).Methods("GET")
	router.NewRoute().Name("/").HandlerFunc(handleFrontendBase).Methods("GET")
	return router
}

func makeTasksRouter() *mux.Router {
	router := mux.NewRouter()
	return router.PathPrefix("/task").Subrouter()
}

func MakeRedirectRouter() *mux.Router {
	router := makeBaseRouter()
	router.HandleFunc("/", func(response srHTTP.Response, request srHTTP.Request) {
		ctx := request.Context()
		log.Printf(ctx, "<< HTTP %v %v %v %v",
			request.RemoteAddr, request.Proto, request.Method, request.URL,
		)
		newURL := config.BackendOrigin.String() + request.URL.String()
		netHTTP.Redirect(response, request, newURL, netHTTP.StatusMovedPermanently)
		dur := taskCtx.FormatDuration(request.Context())
		log.Printf(ctx, ">> 308 %v (%v)", newURL, dur)
	})
	return router
}

func MakeMainRouter() *mux.Router {
	base := makeBaseRouter()
	base.NotFoundHandler = netHTTP.HandlerFunc(srHTTP.ShouldNotBeCalledHandler)
	switch config.HostFrontend {
	case "":
		RESTRouter.HandleFunc("/", handleRoot).Name("(Unhelpful)").Methods("GET")
		base.NewRoute().Name("Backend").Handler(RESTRouter)
		return base
	case "redirect":
		RESTRouter.HandleFunc("/", handleFrontendRedirect).Methods("GET")
		base.NewRoute().Name("Backend + redirect").Handler(RESTRouter)
		return base
	case "by-domain":
		RESTRouter.HandleFunc("/", handleRoot).Methods("GET")
		base.Host(config.BackendOrigin.Host).Name(config.BackendOrigin.Host).Handler(RESTRouter)
		base.Host(config.FrontendOrigin.Host).Name(config.FrontendOrigin.Host).Handler(frontendRouter)
		base.NewRoute().Name("[*] [Default Host redirect]").HandlerFunc(handleFrontendRedirect)
		return base
	case "subroute":
		RESTRouter.HandleFunc("/", handleRoot).Methods("GET")
		base.PathPrefix("/api").Name("Backend").Handler(RESTRouter)
		base.NewRoute().Name("Frontend").Handler(frontendRouter)
		return base
	default:
		panic("Invalid HOST_FRONTEND option") // should be caught in config validation
	}
}
