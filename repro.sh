#!/bin/bash
# repro.sh <WebDriverAgent URL> <simulator udid>: builds GMACloseRepro (build.sh) and installs it on the booted
# simulator, launches it, which shows Google's test interstitial; reads WebDriverAgent's view of Google's close
# ("Close Advertisement") every ~3 s for 30 s, with a screenshot each time (shot-<n>.png); then taps its center and
# reads the app's status label ("dismissed" once the ad closed).
set -e
cd "$(dirname "$0")"
WDA=${1:?usage: repro.sh <WebDriverAgent URL> <simulator udid>} UDID=${2:?usage: repro.sh <WebDriverAgent URL> <simulator udid>}
./build.sh
xcrun simctl install "$UDID" GMACloseRepro.app
close() { curl -s -m 20 "$WDA/source?format=xml" | python3 -c 'import json,sys,re;m=re.search(r"<[^>]*name=\"Close Advertisement\"[^>]*>",json.load(sys.stdin)["value"]);print(m.group(0) if m else "none")'; }
xcrun simctl terminate "$UDID" dev.repro.gmaclose >/dev/null 2>&1 || true
xcrun simctl launch "$UDID" dev.repro.gmaclose >/dev/null
SID=$(curl -s -m 30 -X POST "$WDA/session" -H 'Content-Type: application/json' -d '{"capabilities":{"alwaysMatch":{"bundleId":"dev.repro.gmaclose","shouldWaitForQuiescence":false}}}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["sessionId"])')
for i in $(seq 1 30); do [ "$(close)" != none ] && break; sleep 1; done
start=$(date +%s)
for i in 1 2 3 4 5 6 7 8 9 10; do
	echo "t+$(($(date +%s) - start))s $(close | grep -o 'enabled="[a-z]*"\|traits="[^"]*"' | tr '\n' ' ')"
	xcrun simctl io "$UDID" screenshot "shot-$i.png" >/dev/null 2>&1
	sleep 2
done
# The element's center by coordinates: WebDriverAgent's element click does nothing on an element that reads disabled.
read -r x y < <(close | python3 -c 'import sys,re;a=dict(re.findall(r" (x|y|width|height)=\"([0-9]+)\"",sys.stdin.read()));print(int(a["x"])+int(a["width"])//2,int(a["y"])+int(a["height"])//2)')
curl -s -m 20 -X POST "$WDA/session/$SID/wda/tap" -H 'Content-Type: application/json' -d "{\"x\":$x,\"y\":$y}" >/dev/null
sleep 3
echo "after a tap on it: close $(close | cut -c1-40), status $(curl -s -m 20 "$WDA/source?format=xml" | python3 -c 'import json,sys,re;print(re.findall(r"name=\"(loaded|dismissed)\"",json.load(sys.stdin)["value"]))')"
