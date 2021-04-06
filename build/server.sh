#!/bin/sh

set -ev

cd server
go build -o ../out/sr-server ./main
