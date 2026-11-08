#!/bin/bash
# build.sh: GMACloseRepro.app for the simulator, against the stock Google-Mobile-Ads-SDK 13.6.0 and
# GoogleUserMessagingPlatform 3.1.0, downloaded once into sdk/ from the URLs their CocoaPods podspecs name.
set -e
cd "$(dirname "$0")"
fetch() { # fetch <name> <url>
	[ -d "sdk/$1" ] && return
	mkdir -p "sdk/$1"
	curl -fsSL "$2" | tar -xz -C "sdk/$1"
}
fetch gma https://dl.google.com/dl/cpdc/64b9c711874baae6/Google-Mobile-Ads-SDK-13.6.0.tar.gz
fetch ump https://dl.google.com/dl/cpdc/70c87bb94f697e08/GoogleUserMessagingPlatform-3.1.0.tar.gz
GMA=$(find sdk/gma -type d -path '*GoogleMobileAds.xcframework/ios-arm64_x86_64-simulator' | head -1)
UMP=$(find sdk/ump -type d -path '*UserMessagingPlatform.xcframework/ios-arm64_x86_64-simulator' | head -1)
SDK=$(xcrun --sdk iphonesimulator --show-sdk-path)
TC=$(dirname "$(dirname "$(xcrun -f swiftc)")")/lib/swift/iphonesimulator
mkdir -p GMACloseRepro.app
xcrun --sdk iphonesimulator clang -target arm64-apple-ios15.0-simulator -isysroot "$SDK" -fobjc-arc -fmodules -F"$GMA" -F"$UMP" main.m \
	-o GMACloseRepro.app/GMACloseRepro -ObjC -framework GoogleMobileAds -framework UserMessagingPlatform -L"$TC" -L"$SDK/usr/lib/swift" \
	-Xlinker -rpath -Xlinker /usr/lib/swift -lc++ -lz -lsqlite3 2> >(grep -v '^ld: warning' >&2)
cp Info.plist GMACloseRepro.app/
codesign -s - --force GMACloseRepro.app
