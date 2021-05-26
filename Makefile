# Shadowroller Makefile
#
# Usage:
# make all: makes the server and web.

# run-redis: runs redis using local configuration and save dir
# run-pg: runs postgres using local configuration and save dir

PWD = $(shell pwd)

.PHONY: web server

all: web server

web: server
	cd web && rm -rf build-presite && npm run build
	./out/sr-server -task ppr ./web/build/index.html ./web/build-presite/index.html
	./build/compress-all.sh web/build-presite

watch-web:
	cd web && npm run start

server:
	cd server && go build -v -o ../out/sr-server ./main

watch-server:
	cd server && reflex -sr .*.go -d none go run main/main.go

clean:
	cd web && npm run clean

server-tests:
	cd server && go test ./...

watch-server-tests:
	cd server && reflex -sr .*.go -d none go test ./...

web-tests:
	cd web && npm run test

# If you haven't set up docker to run in userspace, these will require sudo
web-docker:
	docker-compose web
server-docker:
	docker-compose server
docker:
	docker-compose up

redis-cli-docker:
	docker-compose exec redis redis-cli

tmuxp:
	tmuxp load . -a
