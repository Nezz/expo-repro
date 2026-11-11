#!/bin/sh
# Usage: ./run.sh <adb-serial> [rounds=3] [apk]
# Opens reproducer://first, sends the app home, then opens reproducer://second in four cases and prints the screen:
#   alive        the activity and process are still there (control)
#   killed       Android ended the process, the task stays in Recents (react/react-native#59006's case)
#   dont-keep    Developer options' "Don't keep activities": the activity is destroyed, the process lives on
#   font-scale   the font size changes while the app is in the background: Android relaunches the activity, in the
#                same process, when the link brings it back
# "Don't keep activities" is switched in Settings: `settings put global always_finish_activities 1` alone doesn't reach
# the activity manager, and the activity stays alive. Each round prints the activity's state before the 2nd link.
set -eu
serial=${1:?adb serial}
rounds=${2:-3}
apk=${3:-android/app/build/outputs/apk/release/app-release.apk}
app=com.relaunchlink
cd "$(dirname "$0")"
a() { adb -s "$serial" "$@"; }

screen() {
  i=0
  while [ $i -lt 40 ]; do
    out=$(a exec-out uiautomator dump /dev/tty 2>/dev/null | tr '>' '\n' | sed -n 's/.*text="\([^"]*\)".*/\1/p' |
      grep -E '^(getInitialURL|last url event)' | tr '\n' ' ' || true)
    case "$out" in *"getInitialURL(): reproducer"* | *"getInitialURL(): null"*) break ;; esac
    i=$((i + 1))
    sleep 0.5
  done
  sleep 1
  a exec-out uiautomator dump /dev/tty 2>/dev/null | tr '>' '\n' | sed -n 's/.*text="\([^"]*\)".*/\1/p' |
    grep -E '^(getInitialURL|last url event)' | sed 's/^/[/; s/$/]/' | tr '\n' ' '
}
state() {
  a shell dumpsys activity activities | grep -A40 "ActivityRecord{[^}]* $app/.MainActivity" |
    grep -o 'state=[A-Z_]*' | head -1 || echo "state=none"
}
dont_keep() {
  a shell settings put global development_settings_enabled 1
  a shell am start -W -a android.settings.APPLICATION_DEVELOPMENT_SETTINGS \
    --es ":settings:fragment_args_key" immediately_destroy_activities >/dev/null
  sleep 2
  if [ "$(a shell settings get global always_finish_activities)" != "$1" ]; then
    b=$(a exec-out uiautomator dump /dev/tty 2>/dev/null | tr '>' '\n' | grep 'text="Don.t keep activities"' |
      sed -n 's/.*bounds="\[\([0-9]*\),\([0-9]*\)\]\[\([0-9]*\),\([0-9]*\)\]".*/\1 \2 \3 \4/p')
    set -- $b
    a shell input tap $((($1 + $3) / 2)) $((($2 + $4) / 2))
    sleep 1
  fi
  a shell input keyevent KEYCODE_HOME
}
link() { a shell am start -W -a android.intent.action.VIEW -d "$1" "$app" >/dev/null; }
home() { a shell input keyevent KEYCODE_HOME; }

a install -r "$apk" >/dev/null
font_scale=$(a shell settings get system font_scale)
for case in alive killed dont-keep font-scale; do
  dont_keep "$([ "$case" = dont-keep ] && echo 1 || echo 0)"
  r=1
  while [ "$r" -le "$rounds" ]; do
    a shell am force-stop "$app"
    link reproducer://first
    first=$(screen)
    home
    sleep 1
    if [ "$case" = killed ]; then
      a shell am start -W -a android.settings.SETTINGS >/dev/null
      home
      tries=0
      while a shell pidof "$app" >/dev/null && [ $tries -lt 20 ]; do a shell am kill "$app"; sleep 0.5; tries=$((tries + 1)); done
    fi
    [ "$case" = font-scale ] && a shell settings put system font_scale 1.15 && sleep 1
    pid=$(a shell pidof "$app" || true)
    before=$(state)
    launch=$(a shell am start -W -a android.intent.action.VIEW -d reproducer://second "$app" | grep LaunchState | tr -d '\r')
    echo "$case round $r: first ${first}· process before 2nd link: ${pid:-none}, activity ${before} · 2nd link (${launch}) $(screen)"
    home
    a shell settings put system font_scale "$font_scale"
    r=$((r + 1))
  done
done
dont_keep 0
