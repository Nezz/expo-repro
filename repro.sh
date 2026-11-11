#!/bin/bash
# repro.sh <WebDriverAgent URL> <simulator udid>: builds UMPGhostRepro (build.sh), installs it on the booted simulator
# and runs it three ways, printing the accessible elements WebDriverAgent's /source lists after each:
#   1. the consent form shown, then closed with a tap on Consent ("form closed");
#   2. relaunched with -infoOnly YES -keepConsent YES: consent already obtained, only the info request, no form;
#   3. relaunched with -infoOnly YES: consent reset, only the info request, no form.
set -e
cd "$(dirname "$0")"
WDA=${1:?usage: repro.sh <WebDriverAgent URL> <simulator udid>} UDID=${2:?usage: repro.sh <WebDriverAgent URL> <simulator udid>}
./build.sh
xcrun simctl install "$UDID" UMPGhostRepro.app
tree() { curl -s -m 60 "$WDA/source?format=xml" | python3 -c '
import json, sys, xml.etree.ElementTree as ET
for n in ET.fromstring(json.load(sys.stdin)["value"]).iter():
    a = n.attrib
    if a.get("accessible") == "true" or n.tag == "XCUIElementTypeWebView":
        frame = "%s,%s %sx%s" % (a.get("x"), a.get("y"), a.get("width"), a.get("height"))
        print("  %-11s visible=%-5s %-16s %r" % (n.tag[15:], a.get("visible"), frame, (a.get("label") or "")[:60]))'; }
until_seen() { for i in $(seq 1 30); do [ "$(tree | grep -c "$1")" -ge "${2:-1}" ] && return; sleep 1; done; }
launch() { xcrun simctl terminate "$UDID" dev.repro.umpghost >/dev/null 2>&1 || true; xcrun simctl launch "$UDID" dev.repro.umpghost "$@" >/dev/null; }
launch
until_seen "'Consent'" 2
SID=$(curl -s -m 30 -X POST "$WDA/session" -H 'Content-Type: application/json' -d '{"capabilities":{"alwaysMatch":{"shouldWaitForQuiescence":false}}}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["sessionId"])')
read -r x y < <(curl -s -m 60 "$WDA/source?format=xml" | python3 -c '
import json, sys, xml.etree.ElementTree as ET
a = [n.attrib for n in ET.fromstring(json.load(sys.stdin)["value"]).iter() if n.attrib.get("label") == "Consent"][-1]
print(int(a["x"]) + int(a["width"]) // 2, int(a["y"]) + int(a["height"]) // 2)')
curl -s -m 20 -X POST "$WDA/session/$SID/wda/tap" -H 'Content-Type: application/json' -d "{\"x\":$x,\"y\":$y}" >/dev/null
until_seen "form closed"
sleep 2
echo "1. after Consent:"; tree
launch -infoOnly YES -keepConsent YES
until_seen "info updated"
sleep 3
echo "2. relaunched, consent kept, info request only:"; tree
launch -infoOnly YES
until_seen "info updated"
sleep 3
echo "3. relaunched, consent reset, info request only:"; tree
