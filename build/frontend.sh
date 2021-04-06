#!/bin/sh

set -ev

cd web
npm run clean
npm run build

cd ..
./out/sr-server -task ppr \
                web/build/index.html \
                web/build-presite/index.html

./build/compress-all.sh web/build-presite
