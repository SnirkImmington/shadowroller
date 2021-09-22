module sr

go 1.17

require (
	github.com/alicebob/miniredis/v2 v2.15.1
	github.com/go-redis/redis/v8 v8.11.3
	github.com/gorilla/mux v1.8.0
	github.com/janberktold/sse v0.0.0-20160725172337-a8efe87fc656
	github.com/rs/cors v1.7.0
	go.opentelemetry.io/contrib/instrumentation/github.com/gorilla/mux/otelmux v0.24.0
	go.opentelemetry.io/otel v1.0.0
	go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc v1.0.0
	//go.opentelemetry.io/otel/exporters/stdout/stdoutmetric v0.23.0
	go.opentelemetry.io/otel/exporters/stdout/stdouttrace v1.0.0
	go.opentelemetry.io/otel/sdk v1.0.0
	golang.org/x/crypto v0.0.0-20200622213623-75b288015ac9 // ACME support in x/crypto/acme
	golang.org/x/net v0.0.0-20210917221730-978cfadd31cf // indirect
	google.golang.org/grpc v1.40.0
)

require (
	github.com/alicebob/gopher-json v0.0.0-20200520072559-a9ecdc9d1d3a // indirect
	github.com/cenkalti/backoff/v4 v4.1.1 // indirect
	github.com/cespare/xxhash/v2 v2.1.2 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/felixge/httpsnoop v1.0.2 // indirect
	github.com/golang/protobuf v1.5.2 // indirect
	github.com/grpc-ecosystem/grpc-gateway v1.16.0 // indirect
	github.com/yuin/gopher-lua v0.0.0-20200816102855-ee81675732da // indirect
	go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp v0.24.0 // indirect
	go.opentelemetry.io/otel/exporters/otlp/otlptrace v1.0.0 // indirect
	go.opentelemetry.io/otel/internal/metric v0.23.0 // indirect
	go.opentelemetry.io/otel/metric v0.23.0 // indirect
	//go.opentelemetry.io/otel/metric v0.23.0 // indirect
	//go.opentelemetry.io/otel/sdk/export/metric v0.23.0 // indirect
	go.opentelemetry.io/otel/trace v1.0.0 // indirect
	go.opentelemetry.io/proto/otlp v0.9.0 // indirect
	golang.org/x/sys v0.0.0-20210921065528-437939a70204 // indirect
	golang.org/x/text v0.3.7 // indirect
	google.golang.org/genproto v0.0.0-20210921142501-181ce0d877f6 // indirect
	google.golang.org/protobuf v1.27.1 // indirect
)
