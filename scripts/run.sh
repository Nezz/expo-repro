#!/usr/bin/env bash
# Cold-starts the app and measures idle states in the foreground and, after
# pressing Home, in the background (see measure.sh). Usage: scripts/run.sh [runs]
set -euo pipefail
cd "$(dirname "$0")"
PKG=com.adamys.exporepro
open() { adb shell am start -W -a android.intent.action.VIEW -d "$1" $PKG > /dev/null; sleep 5; }
home() { adb shell input keyevent KEYCODE_HOME; sleep 5; }
adb shell svc power stayon true
adb shell input keyevent KEYCODE_WAKEUP
for i in $(seq "${1:-3}"); do
  adb shell am force-stop $PKG
  open "expo-repro://";        ./measure.sh "fg: no Rive loaded"
  home;                        ./measure.sh "bg: no Rive loaded"
  open "expo-repro://paused";  ./measure.sh "fg: paused Rive view"
  home;                        ./measure.sh "bg: paused Rive view"
  open "expo-repro://";        ./measure.sh "fg: Rive view unmounted"
  home;                        ./measure.sh "bg: Rive view unmounted"
done
