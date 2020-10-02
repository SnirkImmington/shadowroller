# Shadowroller Server

![Shadowroller server logs](https://user-images.githubusercontent.com/1468114/94967935-09da2f00-04ce-11eb-9b36-ce3b842abdda.png)

This repository contains the backend code for running the server behind https://shadowroller.net which supports the "multiplayer" aspect of Shadowroller.

The frontend can be found at http://github.com/SnirkImmington/shadowroller. It's currently hosted by GitHub Pages, although this will change in the future.

If you'd like to hear more about the code, read on or check out [the architecture file](/architecture.org). Otherwise, skip to "Run it yourself."

## Server concepts

Right now there are a few basic concepts implemented in Shadowroller:
- *Games* are defined by a Game ID, and not much else. They contain a history of events (mostly dice rolls).
- *Players* are created on the spot whenever you connect to a game. They have a username and a random ID. The client colors them based on the random ID.
- *Events* are individual dice rolls, rolls for initiative, and (currently) when new players are added. They're streamed to players over a persistent connection.
- *Updates* are changes to events or game state. They're designed to allow the server to send clients updates to individual fields on various objects - i.e. update an event's title. At the moment they just exist for deleting and modifying dice rolls, but should be the foundation for mutabiltiy in the game.

## Technology Overview

`sr-server` is a REST API which supports a number of players joining a game and requesting dice rolls ("events"), which are displayed in a chat log/history.
The server uses Go's `net/http` web server with [Gorilla's `mux` library](https://pkg.go.dev/github.com/gorilla/mux) providing some routing utility.
Each player's connection depends on a long running [Server Sent Event connection](https://pkg.go.dev/github.com/gorilla/mux) over which dice rolls and
updates are sent. The client makes requests of the server via typical REST JSON endpoints.

Clients authenticate by submitting a secret Game ID which identifies the game they wish to join. They are given a one-time player ID and a session token
which they may use to re-authenticate (a persistent user system is planned as the next major feature). The session ID is used to authenticate their requests
of the server.

All data for `sr-server` is stored in Redis. This amounts to a `hash` for each game's player ID -> player mapping, each session, and each game, and a sorted
set for the events in a game (sorted by timestamp). Redis pub/sub channels are used to broadcast new events or changes to events to each client's SSE handler.

Why use an in-memory key-value store for the job of a SQL or not database?
I'm being pragmatic. Redis does allow for persistence, so we shouldn't lose more than ~30s of data, and **mostly** there just isn't enough
being stored to warrant setting up a SQL database or migrating things over. I don't expect this to be the case forever but I don't
want to get ahead of myself when there are features to write.

# Run it yourself

## Docker

There's a `Dockerfile` and `docker-compose.yml` included to run the project with Docker.
It uses the `golang` and `redis` packages, as well as [`reflex`](https://github.com/cespare/reflex) for hot-reloading when Go files are changed.
`sudo docker-compose up` starts the API and redis.

## Non-Docker

Right now, the server only has two parts: the REST API and Redis database. As long as you have Go and Redis installed, you can run it without other
dependencies.

`sr-server` is a Go 1.14 module. You can build it with `go build`, or use a tool like [reflex](https://github.com/cespare/reflex) like the Dockerfile does.
The API exposes itself at `0.0.0.0:3001` by default (configurable), which allows devices on your LAN to connect.
If you run the [frontend](https://github.com/SnirkImmington/shadowroller), in dev mode as well, it will find the backend.

The Redis configuration is straightforward: a Redis database needs to exist on its default port of `6379` (configurable).
If you run Redis with the provided `redis.conf` (`redis-server redis.conf`) you'll get a persistent server.

## Configuration

Shadowroller reads configuration options from environment variables starting with `SR_`.
(This is somewhat burdensome over i.e. flags, but it works for 1 of 1 production setups.)
These config vars allow you to set which ports are used, HTTP/HTTPS options (including using Let's Encrypt), and debugging options.
You should set `SR_IS_PRODUCTION=true` if you're running shadowroller exposed
to the internet - read through `config/config.go` first if you plan on doing that.

# Credits

Let's Encrypt TLS server inspired by: https://blog.kowalczyk.info/article/Jl3G/https-for-free-in-go-with-little-help-of-lets-encrypt.html

Gist of the above: https://github.com/kjk/go-cookbook/blob/master/free-ssl-certificates/main.go

TLS hardening options copied from: https://blog.cloudflare.com/exposing-go-on-the-internet/
