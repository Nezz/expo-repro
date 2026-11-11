#!/bin/sh
# Usage: ./run.sh <booted-simulator-udid>
# Builds the app (Release, so no Metro), launches it under lldb and prints AVAudioSession.outputVolume each time
# getVolume() is called, next to the value getVolume() resolves with (the app's "[repro]" log lines).
set -eu
udid=${1:?booted simulator udid}
cd "$(dirname "$0")"
[ -d node_modules ] || npm ci
[ -d ios ] || CI=1 npx expo prebuild --platform ios
xcodebuild -workspace ios/VolumeManagerGetVolume.xcworkspace -scheme VolumeManagerGetVolume -configuration Release \
  -sdk iphonesimulator -destination "id=$udid" -derivedDataPath ios/build CODE_SIGNING_ALLOWED=NO -quiet
xcrun simctl install "$udid" ios/build/Build/Products/Release-iphonesimulator/VolumeManagerGetVolume.app
xcrun simctl terminate "$udid" com.example.volumemanagergetvolume 2>/dev/null || true
xcrun simctl spawn "$udid" log stream --style compact --predicate 'eventMessage CONTAINS "[repro]"' &
logpid=$!
pid=$(xcrun simctl launch --wait-for-debugger "$udid" com.example.volumemanagergetvolume | awk '{print $2}')
out=$(mktemp)
lldb --batch -o "process attach --pid $pid" -s probe.lldb >"$out" 2>&1 &
lldbpid=$!
sleep 10
kill "$lldbpid" "$logpid" 2>/dev/null || true
echo "outputVolume at each getVolume() call:"
grep '(float)' "$out"
