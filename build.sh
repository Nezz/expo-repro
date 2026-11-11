#!/bin/bash
# build.sh: UMPA11yRepro.app for the simulator, against the stock GoogleUserMessagingPlatform 3.1.0, downloaded once
# into sdk/ from the URL its CocoaPods podspec names.
set -e
cd "$(dirname "$0")"
if [ ! -d sdk/ump ]; then
	mkdir -p sdk/ump
	curl -fsSL https://dl.google.com/dl/cpdc/70c87bb94f697e08/GoogleUserMessagingPlatform-3.1.0.tar.gz | tar -xz -C sdk/ump
fi
UMP=$(find sdk/ump -type d -path '*UserMessagingPlatform.xcframework/ios-arm64_x86_64-simulator' | head -1)
SDK=$(xcrun --sdk iphonesimulator --show-sdk-path)
mkdir -p UMPA11yRepro.app
xcrun --sdk iphonesimulator clang -target arm64-apple-ios15.0-simulator -isysroot "$SDK" -fobjc-arc -fmodules -F"$UMP" main.m \
	-o UMPA11yRepro.app/UMPA11yRepro -ObjC -framework UserMessagingPlatform -framework WebKit 2> >(grep -v '^ld: warning' >&2)
cp Info.plist UMPA11yRepro.app/
codesign -s - --force UMPA11yRepro.app
