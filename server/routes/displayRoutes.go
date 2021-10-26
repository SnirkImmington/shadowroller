package routes

import (
	"context"
	"fmt"
	"strings"

	"sr/config"
	"sr/log"

	"github.com/gorilla/mux"
)

func displayRouteWalker(ctx context.Context) func(*mux.Route, *mux.Router, []*mux.Route) error {
	return func(route *mux.Route, handler *mux.Router, parents []*mux.Route) error {
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
				log.Printf(context.Background(), "Attempting to walk %#v %#v, got %v", route, endpoint, err)
				endpoint = "[default]"
			}
		}
		methods, err := route.GetMethods()
		if err != nil { // it's a top level thing
			fmt.Printf("        %v%v\n", indentation, endpoint)
		} else {
			method := strings.ToLower(methods[0])
			if method == "get" {
				method = " get"
			}
			fmt.Printf("        %v%v %v\n", indentation, method, endpoint)
		}
		return nil
	}
}

// DisplaySiteRoutes prints the list of routes the site will handle
func DisplaySiteRoutes(ctx context.Context) error {
	walker := displayRouteWalker(ctx)
	err := MakeMainRouter().Walk(walker)
	fmt.Println()
	return err
}
