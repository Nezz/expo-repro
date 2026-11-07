#!/bin/sh
# Usage: ./run.sh <adb-serial> [runs=20]
# Each run force-stops the app, cold-starts it with repro://linked and, 8 s later, prints the route on screen.
set -u
serial=${1:?adb serial}
runs=${2:-20}
a() { adb -s "$serial" "$@"; }

linked=0
i=1
while [ "$i" -le "$runs" ]; do
  a shell am force-stop com.example.initialurl
  sleep 2
  a shell am start -W -a android.intent.action.VIEW -d repro://linked com.example.initialurl >/dev/null
  sleep 8
  route=$(a exec-out uiautomator dump /dev/tty 2>/dev/null | tr '>' '\n' | sed -n 's/.*text="\(route: [a-z]*\)".*/\1/p' | head -1)
  echo "run $i: ${route:-route: none}"
  [ "$route" = "route: linked" ] && linked=$((linked + 1))
  i=$((i + 1))
done
echo "linked $linked of $runs"
