#!/bin/sh
# Usage: ./run.sh <booted-simulator-udid>
# Builds the app (Release, so no Metro), launches it under lldb and prints every AVAudioSession setCategory/setActive
# call with its caller, then the session's category and options once VolumeManager's -init has run.
set -eu
udid=${1:?booted simulator udid}
cd "$(dirname "$0")"
[ -d node_modules ] || npm ci
[ -d ios ] || CI=1 npx expo prebuild --platform ios
xcodebuild -workspace ios/VolumeManagerSession.xcworkspace -scheme VolumeManagerSession -configuration Release \
  -sdk iphonesimulator -destination "id=$udid" -derivedDataPath ios/build CODE_SIGNING_ALLOWED=NO -quiet
xcrun simctl install "$udid" ios/build/Build/Products/Release-iphonesimulator/VolumeManagerSession.app
xcrun simctl terminate "$udid" com.example.volumemanagersession 2>/dev/null || true
pid=$(xcrun simctl launch --wait-for-debugger "$udid" com.example.volumemanagersession | awk '{print $2}')
lldb --batch -o "process attach --pid $pid" -s probe.lldb | sed -n '/^(lldb) continue/,$p'
