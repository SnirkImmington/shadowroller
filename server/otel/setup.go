package otel

import (
	"context"
	"crypto/tls"
	"fmt"
	stdLog "log"
	"strings"
	"time"

	"sr/config"
	"sr/shutdown"

	"go.opentelemetry.io/otel"
	traceExport "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/trace"

	//"go.opentelemetry.io/otel/exporters/stdout/stdoutmetric"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/semconv/v1.4.0"

	"go.opentelemetry.io/otel/sdk/resource"
	traceSDK "go.opentelemetry.io/otel/sdk/trace"

	"google.golang.org/grpc/credentials"
)

var Tracer trace.Tracer

func DefaultResource(ctx context.Context) *resource.Resource {
	result, err := resource.New(ctx,
		resource.WithHost(),
		resource.WithOS(),
		resource.WithTelemetrySDK(),
		resource.WithAttributes(
			semconv.ServiceNameKey.String("server"),
		),
	)
	if err != nil {
		stdLog.Printf("otel init: DefaultResource: %v", err)
		panic("Failed to create default resource")
	}
	return result
}

func CreateStdoutTrace(ctx context.Context) func(context.Context) error {
	traceExporter, err := stdouttrace.New(
		stdouttrace.WithPrettyPrint(),
	)
	if err != nil {
		stdLog.Printf("otel init: CreateStdoutTrace: %v", err)
		panic("Failed to create stdout tracer")
	}

	spanProcessor := traceSDK.NewBatchSpanProcessor(traceExporter)
	tracerProvider := traceSDK.NewTracerProvider(
		traceSDK.WithSpanProcessor(spanProcessor),
		traceSDK.WithResource(DefaultResource(ctx)),
	)

	otel.SetTracerProvider(tracerProvider)
	propagator := propagation.NewCompositeTextMapPropagator(
		propagation.Baggage{},
		propagation.TraceContext{},
	)
	otel.SetTextMapPropagator(propagator)

	return tracerProvider.Shutdown
}

func CreateUptraceTrace(ctx context.Context) func(context.Context) error {
	traceExporter, err := traceExport.New(ctx,
		traceExport.WithEndpoint(config.UptraceExportURL),
		traceExport.WithHeaders(map[string]string{
			"uptrace-dsn": string(config.UptraceDSN),
		}),
		traceExport.WithTLSCredentials(credentials.NewTLS(&tls.Config{
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
		})),
	)
	if err != nil {
		stdLog.Printf("otel init: CreateUptraceTrace: %v", err)
		panic("Failed to create grpc traces exporter")
	}

	tracerProvider := traceSDK.NewTracerProvider(
		traceSDK.WithBatcher(traceExporter),
		traceSDK.WithResource(DefaultResource(ctx)),
	)

	otel.SetTracerProvider(tracerProvider)
	propagator := propagation.NewCompositeTextMapPropagator(
		propagation.Baggage{},
		propagation.TraceContext{},
	)
	otel.SetTextMapPropagator(propagator)

	return tracerProvider.Shutdown
}

func CreateTraceExporter(ctx context.Context) func(context.Context) error {
	if config.OtelExport == "stdout" {
		return CreateStdoutTrace(ctx)
	} else if strings.HasPrefix(config.OtelExport, "otlp:") {
		panic("raw otlp unimplemented")
	} else if config.OtelExport == "uptrace" {
		if config.UptraceDSN == "" {
			panic("Unable to get uptrace DSN")
		}
		return CreateUptraceTrace(ctx)
	}
	panic(fmt.Sprintf("Invalid otel export %v", config.OtelExport))
}

func Setup(ctx context.Context) {
	ctx, release := shutdown.Register(ctx, "otel")
	shutdown := CreateTraceExporter(ctx)
	Tracer = otel.GetTracerProvider().Tracer("shadowroller")
	go func() {
		<-ctx.Done()
		defer release()
		ctx := context.Background()
		ctx, cancel := context.WithTimeout(ctx, time.Duration(8)*time.Second)
		defer cancel()
		err := shutdown(ctx)
		if err != nil {
			stdLog.Printf("otel shutdown error: %v", err)
		}
	}()
}
