#!/bin/sh
# Usage: ./run.sh <adb-serial> [runs=10] [modes="flatten reorder control delayed goBack"]
# Runs .maestro/close.yaml <runs> times per mode on an installed Release build, and counts the runs whose logcat has
# the addViewAt crash. Each line also gives the logcat times of the commit with the move and of the commit that
# removes the screen.
set -u
serial=${1:?adb serial}
runs=${2:-10}
modes=${3:-flatten reorder control delayed goBack}
flow="$(dirname "$0")/.maestro/close.yaml"
for mode in $modes; do
  crashes=0
  i=1
  while [ "$i" -le "$runs" ]; do
    adb -s "$serial" logcat -c
    if maestro --device "$serial" test -e MODE="$mode" "$flow" >/dev/null 2>&1; then result=passed; else result=failed; fi
    log=$(adb -s "$serial" logcat -d)
    crash=$(echo "$log" | grep -m1 'addViewAt: cannot insert view' | sed 's/.*addViewAt/addViewAt/')
    [ -n "$crash" ] && crashes=$((crashes + 1))
    commits=$(echo "$log" | grep 'ReactNativeJS: repro:' | awk '{ print $2 }' | paste -sd ' ' -)
    echo "$mode run $i: flow $result, commits at [$commits]${crash:+, $crash}"
    i=$((i + 1))
  done
  echo "$mode: $crashes of $runs crashed"
done
