#!/usr/bin/env sh
if (( $# != 1 )); then
    >&2 echo "Usage: gen-keyfile.sh <filename>"
    exit 1
fi

echo $(head -q -c 512 '/dev/random' | base64 -w 0) > $1
