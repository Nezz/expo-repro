#!/bin/sh
# Builds the app in Release (JS bundle embedded, no Metro), installs it in the "${SIM:-booted}" simulator, launches it and measures.
set -e
cd "$(dirname "$0")/ios"
xcodebuild -workspace ReanimatedIdle.xcworkspace -scheme ReanimatedIdle -configuration Release -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath build build -quiet > build/xcodebuild.log 2>&1
xcrun simctl terminate "${SIM:-booted}" org.reactjs.native.example.ReanimatedIdle 2>/dev/null || true
xcrun simctl install "${SIM:-booted}" build/Build/Products/Release-iphonesimulator/ReanimatedIdle.app
xcrun simctl launch "${SIM:-booted}" org.reactjs.native.example.ReanimatedIdle >/dev/null
../measure.sh
