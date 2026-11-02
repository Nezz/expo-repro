#!/usr/bin/env bash
# Builds the app in Release for an iOS simulator, installs it fresh, lets it reload itself in a loop and stops at
# the first crash (printing the launch count and the crash report's faulting stack) or after MAX launches.
# Usage: ./loop.sh <simulator-udid> [max-launches=300] [--no-build]
set -euo pipefail
UDID=${1:?simulator udid}
MAX=${2:-300}
BUILD=${3:-}
APP=WorkletsReloadRepro
BUNDLE_ID=com.example.workletsreloadrepro
cd "$(dirname "$0")"

xcrun simctl boot "$UDID" 2>/dev/null || true
if [ "$BUILD" != "--no-build" ]; then
  [ -d node_modules ] || npm install
  [ -d ios ] || npx expo prebuild --platform ios
  xcodebuild -workspace "ios/$APP.xcworkspace" -scheme "$APP" \
    -configuration Release -sdk iphonesimulator -destination "id=$UDID" -derivedDataPath build \
    CODE_SIGNING_ALLOWED=NO build -quiet
fi

xcrun simctl uninstall "$UDID" "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl install "$UDID" "build/Build/Products/Release-iphonesimulator/$APP.app"
marker=$(mktemp)
xcrun simctl launch "$UDID" "$BUNDLE_ID" >/dev/null
counter="$(xcrun simctl get_app_container "$UDID" "$BUNDLE_ID" data)/Documents/launches.txt"

last=0
last_change=$(date +%s)
while true; do
  sleep 1
  launch=$(cat "$counter" 2>/dev/null || echo 0)
  if [ "$launch" != "$last" ]; then last=$launch; last_change=$(date +%s); fi
  pid=$(xcrun simctl spawn "$UDID" launchctl list | awk -v id="UIKitApplication:$BUNDLE_ID" 'index($3, id) == 1 { print $1 }')
  if ! [[ "$pid" =~ ^[0-9]+$ ]]; then
    report=
    for _ in $(seq 30); do
      report=$(find ~/Library/Logs/DiagnosticReports -name "$APP-*.ips" -newer "$marker" | sort | tail -1)
      [ -n "$report" ] && break
      sleep 1
    done
    echo "RESULT crash launch=$launch reloads=$((launch - 1)) report=${report:-none}"
    [ -n "$report" ] && python3 - "$report" <<'PY'
import json, sys
text = open(sys.argv[1]).read()
body = json.loads(text[text.index('\n') + 1:])
exc = body.get('exception', {})
print('exception:', exc.get('type'), exc.get('signal'), exc.get('subtype', ''))
images = body['usedImages']
for i, thread in enumerate(body['threads']):
    if not thread.get('triggered'):
        continue
    print(f"faulting thread {i} {thread.get('name', thread.get('queue', ''))}")
    for n, f in enumerate(thread['frames'][:30]):
        image = images[f['imageIndex']].get('name', '?')
        print(f"  {n:2} {image:28} {f.get('symbol', hex(f['imageOffset']))}")
PY
    exit 1
  fi
  if [ "$launch" -ge "$MAX" ]; then
    xcrun simctl terminate "$UDID" "$BUNDLE_ID" || true
    echo "RESULT no-crash launches=$launch reloads=$((launch - 1))"
    exit 0
  fi
  if [ $(( $(date +%s) - last_change )) -gt 60 ]; then
    echo "RESULT stalled launch=$launch"
    exit 2
  fi
done
