#!/bin/sh
# Usage: ./hammer.sh <route> [count]   e.g. ./hammer.sh leak 50
PORT=${PORT:-8095}
for i in $(seq 1 "${2:-50}"); do curl -s -o /dev/null "http://localhost:$PORT/api/$1"; done
echo "sent ${2:-50} requests to /api/$1"
