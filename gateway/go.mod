module shadowroller.net/gateway

go 1.17

require shadowroller.net/libsr v0.0.0-local

replace shadowroller.net/libsr => ../libsr

require (
	github.com/cespare/xxhash/v2 v2.1.2 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/go-redis/redis/v8 v8.11.3 // indirect
	go.opentelemetry.io/otel v1.3.0 // indirect
	go.opentelemetry.io/otel/trace v1.3.0 // indirect
)
