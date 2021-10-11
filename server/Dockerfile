# This is a basic Dockerfile for running go + reflex,
# a code reloader, for code set up in `reflex.conf`.

# This is for development paired with docker-compse.

# https://threedots.tech/post/go-docker-dev-environment-with-go-modules-and-live-code-reloading/

FROM golang:1.17.2-alpine

WORKDIR /go/src/sr
COPY . .

RUN go get -v github.com/cespare/reflex
RUN go install -v github.com/cespare/reflex

RUN go build -v

ENTRYPOINT ["go", "run", "main/main.go"]
