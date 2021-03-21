#!/bin/sh

set -e

find $1 -type f -name '*.gz' -print -exec rm {} \;
