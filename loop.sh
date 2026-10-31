#!/bin/bash
# Runs N reload trials on a booted iOS simulator and counts crashes.
#
# Each trial launches the app fresh. The app mounts, reloads once with
# DevSettings.reload() after reloadDelayMs, and the mount after the reload
# records `survivedTrial`. A trial is a crash if the process dies before that
# (macOS stops writing .ips reports after the first few crashes of a loop, so
# they can't be counted).
#
#   ./loop.sh <label> <trials> [key=value ...]
#   ./loop.sh busy-50 20 busyAfterReloadMs=50
#
# Keys are CONFIG knobs from App.tsx (commands, busyAfterReloadMs,
# reloadDelayMs, focused, treeSize); unset ones get App.tsx's defaults.
# Needs Metro running and the Debug app installed.
# Env: UDID (default: booted), RESULTS (default: results.csv).
set -u

LABEL=$1
TRIALS=$2
shift 2
UDID=${UDID:-booted}
BUNDLE=org.reactjs.native.example.ReproducerApp
RESULTS=${RESULTS:-results.csv}
TIMEOUT_S=${TIMEOUT_S:-30}

defaults_write() {
  xcrun simctl spawn "$UDID" defaults write "$BUNDLE" "$1" -int "$2"
}

# The app's own writes land in its data container's plist, which
# `simctl spawn defaults read` doesn't see.
PLIST="$(xcrun simctl get_app_container "$UDID" "$BUNDLE" data)/Library/Preferences/$BUNDLE.plist"
defaults_read() {
  # JS numbers arrive as doubles, e.g. 48475003.000000.
  plutil -extract "$1" raw "$PLIST" 2>/dev/null | cut -d. -f1
}

[ -f "$RESULTS" ] || echo "label,trial,outcome,seconds" >"$RESULTS"

xcrun simctl terminate "$UDID" "$BUNDLE" >/dev/null 2>&1
defaults_write autoReload 0
defaults_write commands 1
defaults_write busyAfterReloadMs 100
defaults_write reloadDelayMs 1000
defaults_write focused 0
defaults_write treeSize 0
for pair in "$@"; do
  defaults_write "${pair%%=*}" "${pair#*=}"
done

crashes=0
base=$(( $(date +%s) % 100000 * 1000 ))
for i in $(seq 1 "$TRIALS"); do
  trial=$((base + i))
  defaults_write trial "$trial"
  pid=$(xcrun simctl launch "$UDID" "$BUNDLE" | awk '{print $NF}')
  if [ -z "$pid" ]; then
    echo "launch failed" >&2
    exit 1
  fi
  start=$(date +%s)
  outcome=timeout
  while [ $(( $(date +%s) - start )) -lt "$TIMEOUT_S" ]; do
    if ! kill -0 "$pid" 2>/dev/null; then
      outcome=crash
      break
    fi
    if [ "$(defaults_read survivedTrial)" = "$trial" ]; then
      outcome=ok
      break
    fi
    sleep 0.3
  done
  seconds=$(( $(date +%s) - start ))
  [ "$outcome" = crash ] && crashes=$((crashes + 1))
  echo "$LABEL,$i,$outcome,$seconds" | tee -a "$RESULTS"
  xcrun simctl terminate "$UDID" "$BUNDLE" >/dev/null 2>&1
done
defaults_write autoReload 1
echo "$LABEL: $crashes crashes in $TRIALS reloads"
