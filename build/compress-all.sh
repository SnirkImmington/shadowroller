#!/bin/sh

set -e

gzip -rk $1

find $1 -type f -name '*.woff2.gz' -print -exec rm {} \;

gzip -lr $1
