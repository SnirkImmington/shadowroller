# This is a basic Dockerfile for running go + reflex,
# a code reloader, for code set up in `reflex.conf`.

# This is for development paired with docker-compse.

# https://threedots.tech/post/go-docker-dev-environment-with-go-modules-and-live-code-reloading/

FROM golang:latest
WORKDIR .
RUN go get github.com/cespare/reflex
RUN go build
ENTRYPOINT ["reflex", "-s", "-r" ".*.go", "go run main/main.go"]
