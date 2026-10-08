#!/usr/bin/env bash
# Measures the app's main thread for SECONDS on the connected Android device:
# Choreographer#doFrame callbacks (atrace), wakeups (voluntary context
# switches) and CPU time. Usage: scripts/measure.sh <label> [seconds]
set -euo pipefail
PKG=com.adamys.exporepro
LABEL=${1:?label}
SECONDS_=${2:-10}
PID=$(adb shell pidof "$PKG" | tr -d '\r')

sample() {
  adb shell "cat /proc/$PID/task/$PID/status /proc/$PID/task/$PID/stat" | tr -d '\r' |
    awk '/^voluntary_ctxt_switches/ {v=$2} /^nonvoluntary_ctxt_switches/ {n=$2}
         /^[0-9]+ \(/ {sub(/^.*\) /, ""); cpu=$12+$13} END {print v, n, cpu}'
}

read -r v0 n0 c0 < <(sample)
FRAMES=$(adb shell atrace -t "$SECONDS_" view | tr -d '\r' | grep -c "B|$PID|Choreographer#doFrame" || true)
read -r v1 n1 c1 < <(sample)

TICK_MS=10 # CLK_TCK = 100
printf '%-28s doFrame/s %6.1f   main-thread wakeups/s %6.1f   main-thread CPU %5.1f%%\n' \
  "$LABEL" \
  "$(echo "$FRAMES / $SECONDS_" | bc -l)" \
  "$(echo "($v1 - $v0 + $n1 - $n0) / $SECONDS_" | bc -l)" \
  "$(echo "($c1 - $c0) * $TICK_MS / ($SECONDS_ * 10)" | bc -l)"
