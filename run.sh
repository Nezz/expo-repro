#!/bin/sh
# Usage: ./run.sh <adb-serial> [rounds=3] [package=com.example.repro] [cases="alive dont-keep font-scale killed"]
# Opens the app from the launcher, sends it home, then opens repro://metronome and prints the route on screen:
#   alive        the activity and process are still there (control)
#   dont-keep    Developer options' "Don't keep activities": the activity is destroyed, the process lives on
#   font-scale   the font size changes while the app is in the background: the activity is relaunched in the same
#                process when the link brings it back
#   killed       Android ended the process, the task stays in Recents (react/react-native#59006's case)
# "Don't keep activities" is switched in Settings' UI: `settings put global always_finish_activities 1` alone doesn't
# reach the activity manager. Each round prints the activity's state before the link, from dumpsys.
set -eu
serial=${1:?adb serial}
rounds=${2:-3}
app=${3:-com.example.repro}
cases=${4:-alive dont-keep font-scale killed}
a() { adb -s "$serial" "$@"; }

texts() { a exec-out uiautomator dump /dev/tty 2>/dev/null | tr '>' '\n' | sed -n 's/.*text="\([^"]*\)".*/\1/p'; }
route() {
  i=0
  while [ $i -lt 30 ]; do
    out=$(texts | grep '^route: ' || true)
    [ -n "$out" ] && break
    i=$((i + 1))
    sleep 0.5
  done
  sleep 2
  texts | grep '^route: ' | head -1 || echo "route: none"
}
state() {
  a shell dumpsys activity activities | grep -A40 "ActivityRecord{[^}]* $app/.MainActivity" |
    grep -o 'state=[A-Z_]*' | head -1 || echo "state=none"
}
dont_keep() {
  want=$1
  a shell settings put global development_settings_enabled 1
  a shell am start -W -a android.settings.APPLICATION_DEVELOPMENT_SETTINGS \
    --es ":settings:fragment_args_key" immediately_destroy_activities >/dev/null
  sleep 2
  now=$(a shell settings get global always_finish_activities)
  if [ "$now" != "$want" ]; then
    bounds=$(a exec-out uiautomator dump /dev/tty 2>/dev/null | tr '>' '\n' |
      grep "text=\"Don.t keep activities\"" | sed -n 's/.*bounds="\[\([0-9]*\),\([0-9]*\)\]\[\([0-9]*\),\([0-9]*\)\]".*/\1 \2 \3 \4/p')
    set -- $bounds
    a shell input tap $((($1 + $3) / 2)) $((($2 + $4) / 2))
    sleep 1
  fi
  a shell input keyevent KEYCODE_HOME
  echo "always_finish_activities=$(a shell settings get global always_finish_activities)"
}

font_scale=$(a shell settings get system font_scale)
for case in $cases; do
  case "$case" in dont-keep) dont_keep 1 ;; *) dont_keep 0 >/dev/null ;; esac
  r=1
  while [ "$r" -le "$rounds" ]; do
    a shell am force-stop "$app"
    a shell am start -W -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -n "$app/.MainActivity" >/dev/null
    first=$(route)
    a shell input keyevent KEYCODE_HOME
    sleep 2
    case "$case" in
      killed)
        tries=0
        while a shell pidof "$app" >/dev/null && [ $tries -lt 20 ]; do a shell am kill "$app"; sleep 0.5; tries=$((tries + 1)); done
        ;;
      font-scale) a shell settings put system font_scale 1.15 && sleep 1 ;;
    esac
    pid=$(a shell pidof "$app" || true)
    before=$(state)
    launch=$(a shell am start -W -a android.intent.action.VIEW -d repro://metronome "$app" | grep LaunchState | tr -d '\r')
    echo "$case round $r: launcher [$first] · before the link: process ${pid:-none}, $before · link [$(route)] ${launch}"
    [ "$case" = font-scale ] && a shell settings put system font_scale "$font_scale"
    r=$((r + 1))
  done
done
dont_keep 0 >/dev/null
