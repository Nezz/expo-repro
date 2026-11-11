#!/bin/sh
# Usage: ./run.sh [adb-serial=emulator-5554] [rounds=3]
# Plays each case on the repro app (already open) with two-finger injection, then prints what onSlidingComplete
# reported. Maestro and `adb shell input` drive one finger only, so the fingers go in as raw sendevent through touch.py.
# sendevent needs a root adbd (`adb root`, which an emulator's Google APIs image allows).
# Screen coordinates are for a 1080x2400 emulator (Pixel 7 AVD), the slider across the middle of the screen.
#   one-finger       finger A drags from the thumb to x=200 and lifts: reports about 10 (control)
#   b-lifts-first    A drags to x=200, B goes down at x=950 on the slider's row, B lifts, then A: about 10 (control)
#   a-lifts-first    A drags to x=200, B goes down at x=950, A lifts, then B: should report about 10
#   b-elsewhere      as a-lifts-first, but B is far below the slider (y=2000): should report about 10
set -eu
serial=${1:-emulator-5554}
rounds=${2:-3}
here=$(cd "$(dirname "$0")" && pwd)
y=1292
a() { adb -s "$serial" "$@"; }
a root >/dev/null
a wait-for-device
play() { a shell "$(python3 -I "$here/touch.py" "$1")"; }
complete() {
  sleep 1
  a exec-out uiautomator dump /dev/tty 2>/dev/null | tr '>' '\n' | sed -n 's/.*text="\(complete: [^"]*\)".*/\1/p' | head -1
}
reset() { play "down 0 540 $y; wait 0.1; up 0"; sleep 1; }
drag_a() { echo "down 0 540 $y; wait 0.1; move 0 450 $y; wait 0.05; move 0 350 $y; wait 0.05; move 0 200 $y; wait 0.2"; }

for round in $(seq 1 "$rounds"); do
  reset
  play "$(drag_a); up 0"
  echo "round $round one-finger: $(complete)"
  reset
  play "$(drag_a); down 1 950 $y; wait 0.2; up 1; wait 0.2; up 0"
  echo "round $round b-lifts-first: $(complete)"
  reset
  play "$(drag_a); down 1 950 $y; wait 0.2; up 0; wait 0.2; move 1 960 $y; wait 0.2; up 1"
  echo "round $round a-lifts-first: $(complete)"
  reset
  play "$(drag_a); down 1 950 2000; wait 0.2; up 0; wait 0.2; move 1 960 2000; wait 0.2; up 1"
  echo "round $round b-elsewhere: $(complete)"
done
