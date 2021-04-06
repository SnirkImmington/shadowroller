# Shadowroller Makefile
#
# Usage:
# make all: makes the server and web.

# run-redis: runs redis using local configuration and save dir
# run-pg: runs postgres using local configuration and save dir

.PHONY: web server

all: web server

web: server
	cd web && npm run build
	./out/sr-server -task ppr ./web/build/index.html ./web/build-presite/index.html
	./build/compress-all.sh web/build-presite

server:
	cd server && go build -v -o ../out/sr-server ./main

clean:
	cd web && npm run clean
