#!/bin/sh

set -ev

docker run --it --rm \
       --name web \
       --volume ./web:/var/code \
       -w /var/code \
       -u node \
       node:latest-alpine npm run start
