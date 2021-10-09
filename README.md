# Shadowroller (https://shadowroller.net/)

Shadowroller (https://shadowroller.net/) is work-in-progress a website that lets you roll lots of d6's and follow Shadowrun's dice rules.

![Desktop screenshot Oct 02 2020](https://user-images.githubusercontent.com/1468114/94968996-ea440600-04cf-11eb-97eb-faca0af677f3.png)

[![build badge](https://github.com/SnirkImmington/shadowroller/actions/workflows/ci.yml/badge.svg)](https://github.com/SnirkImmington/shadowroller/actions/workflows/ci.yml)

There is a server ([sr-server](https://github.com/SnirkImmington/sr-server)) which runs games for my friends.
This system is not available for the general internet at the moment.
You can run a local version of the server yourself if you'd like - it's easy if
you're comfortable with the command line and port forwarding. Please read the
**Local development** and **Production environment** sections first!

## Local development

### Editor setup

You will at the minimum want an editor which can handle Go and Typescript. IDE
support for both of these languages is available via the Language Server
protocol. You might need to install NodeJS and Go locally in order to have a
nice editor experience, in which case it may not be worth it to run Docker.

### Docker

Running Shadowroller locally with Docker can be easier than running it manually,
but it can be a liiiitle slower to boot up.
_If you're unfamiliar with Docker, it may be a good idea to read up on the
basics. You can install docker from your package manager or
[their website](https://www.docker.com/get-started)._

Shadowroller uses [`docker compose`](https://docs.docker.com/compose/) to run
containers in development. Running Shadowroller locally is just a matter of
typing

```bash
docker-compose up
```

in a terminal when you're at the root directory of the project. The web and
server with both automatically refresh when changes are made in the `web/` and
`server/` directories.

If you install or upgrade dependencies (i.e. `package.json`,
`package-lock.json`, `go.mod`, or `go.sum` change), you'll need to rebuild the
container(s) via `docker-compose build web` or `docker-compose build server`.

### Locally

Take a look at the `Makefile`, it's got a collection of basic scripts you can run.

The easiest way to run Shadowroller locally is to use
[Tmuxp](https://tmuxp.git-pull.com/about.html) (a Python library) with
[tmux](https://github.com/tmux/tmux). There's a `.tmuxp.yaml` file which is
essentially a scripted way to run all the components in different terminals in
one tmux window. (If you're a `tmux` or `screen` pro and could set this up with
shell script, I'll happily accept your submission!)

This requires only
[reflex](https://github.com/cespare/reflex), which you can replace with your
"watch-the-`.go`-files-and-rerun-`go run`-when-one-changes" script of your choice.

**Redis** (https://redis.io/):
_At the time of writing, Shadowroller tries to add test games to the default Redis_
_database when it boots up in a dev environment._
You can use the provided configuration: `redis-server redis/redis.conf`. This
saves a persistent database to `redis/sr-server.rdb` and isolates Shadowroller
from any "default" Redis database. You can also simply use the built-in service
manager (i.e. `systemctl enable redis` or `brew services start redis`).

**Server (Go)** (https://golang.org)
Shadowroller may be using a version of Go newer than that provided by your
package manager. Go is typically installed
[from its website](https://golang.org/doc/install). As mentioned above, you may
want a script to restart the server automatically when its `.go` files change.

**Frontend (Typescript)** (https://nodejs.org/)
Shadowroller's frontend is compiled from
[Typescript](https://typescriptlang.org) into a single-page app (SPA). In
development, `npm run start` (from the `web` directory) will run a hot-reloading
server (from [Create React App](https://create-react-app.dev)). You can also
build the frontend yourself (via `make build`) and have the server host it.

You can run the frontend and backend independently if you like, but you can't
run the server without Redis.

### On production

You can totally run your own version of Shadowroller on the internet if you want
to! That's the power of free software! Shadowroller runs perfectly fine on a
Raspberry Pi and there is plenty of configuration to help you out.

Please look at `server/config/config.go` to get a sense of some of the options.
For example, you can:
- use SSL termination, an automatic Let's Encrypt setup, or your own certificate
- Host the frontend via a CDN or with the server

Please make sure you've read through `config.go` so you **know what you're doing**!

It should be fairly easy to tweak the `docker-compose.yaml` file to include
these options, or even use Docker Swarm or Kubernetes. I've run shadowroller.net
from a Raspberry Pi B (the oldest Model B, the one with a _single-core_ CPU)
without Docker.

## Credits & Attribution

Shadowroller's source code is licensed under the MIT license available in the
`LICENSE` file. Shadowroller is free software; you may redistribute or modify it
to your liking.

Shadowroller's logo is (c) Alyssa Colon, licensed under
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
She's `@colon_capers` on Instagram.

Shadwroller's other non-software assets in `assets/` (such as our dice icons) are licensed under
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) - they may
be shared and adapted non-commercially and with attribution.

Shadowroller is built with [React](https://reactjs.org), with developer experience
greatly improved by [Typescript](https://typescriptlang.org/).
Site UI and CSS is done via [Styled Components](https://styled-components.com).
[React window](https://react-window.now.sh/) provides a nicer scrolling experience.

Shadowroller's server is written in [Go](https://golang.org/), using the
[Gorilla](https://github.com/gorilla) routers that build on top of the standard
library's robust HTTP server. We use [Redis](https://redis.io/) for storage,
accessed via the [go-redis](https://github.com/go-redis/redis) library. We use
[OpenTelementry](https://opentelemetry.io/) for tracing and error reporting via
[Uptrace](https://uptrace.dev).

Shadowroller uses icons from [Font Awesome](https://fontawesome.com).

Shadowroller uses the beautiful open source font
[Source Code Pro](https://github.com/adobe-fonts/source-code-pro), an elegant
monospace masterpiece from
[Adobe Originals](https://fonts.adobe.com/foundries/adobe) designers
[Paul D. Hunt](https://fonts.adobe.com/designers/paul-d-hunt) and
[Teo Tuominen](https://fonts.adobe.com/designers/teo-tuominen),
and redistributes it under the terms of the
[OFL 1.1](https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=OFL)
to keep page load times down.
