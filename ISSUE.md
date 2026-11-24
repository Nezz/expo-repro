### Description

We have a chat screen built on an inverted `FlatList` with a header and `maintainVisibleContentPosition={{ minIndexForVisible: 1 }}`. When a user edited a message so that only one message was left, the whole chat scrolled away and the screen went blank. The offset ended up around -18000 pt.

Here's what happens. Before each mount, `_prepareForMaintainVisibleScrollPosition` remembers an anchor view, and after the mount `_adjustForMaintainVisibleContentPosition` moves the offset by however far that view moved. When the list has no child at `minIndexForVisible` any more (here: the header plus one row), prepare finds nothing and returns early, but it never clears the old anchor. So adjust keeps applying the same old delta on every commit. Each adjustment fires `onScroll`, which sets state, which commits again, and the list scrolls away on its own.

The same stale anchor also survives while `maintainVisibleContentPosition` is turned off, so turning it back on applies one old delta.

**Fix:** clear the anchor at the very top of `_prepareForMaintainVisibleScrollPosition`:

```objc
- (void)_prepareForMaintainVisibleScrollPosition
{
  _firstVisibleView = nil;
  ...
```

With that one line, React Native 0.88.1 built from source held still in 5 of 5 runs; without it, it ran away in 3 of 3.

Related, with different triggers: #52757 / #52782, #58578, #58913.

### Steps to reproduce

1. Run the reproducer on an iOS simulator (`npm install`, `cd ios && bundle exec pod install`, `npx react-native run-ios`).
2. Tap **Remove newest**. The offset goes to -64 and stays there, as expected.
3. Tap **Remove newest** again, leaving one row.

**Expected:** the offset settles.
**Actual:** it keeps falling on its own, past -600,000 pt within 2 seconds. 10 of 10 runs in Debug and 10 of 10 in Release.

### React Native Version

0.88.1

### Affected Platforms

Runtime - iOS

### Output of `npx @react-native-community/cli info`

```text
System:
  OS: macOS 26.7.1
  CPU: (14) arm64 Apple M4 Max
  Memory: 510.27 MB / 36.00 GB
  Shell:
    version: "5.9"
    path: /bin/zsh
Binaries:
  Node:
    version: 26.10.0
    path: /opt/homebrew/bin/node
  Yarn: Not Found
  npm:
    version: 11.19.1
    path: /opt/homebrew/bin/npm
  Watchman: Not Found
Managers:
  CocoaPods:
    version: 1.17.0
    path: /opt/homebrew/bin/pod
SDKs:
  iOS SDK:
    Platforms:
      - DriverKit 27.2
      - iOS 27.2
      - macOS 27.2
      - tvOS 27.2
      - visionOS 27.2
      - watchOS 27.2
  Android SDK: Not Found
IDEs:
  Android Studio: 2025.3 AI-253.30387.90.2532.14935130
  Xcode:
    version: 27.2/27B52
    path: /usr/bin/xcodebuild
Languages:
  Java:
    version: 17.0.20.1
    path: /usr/bin/javac
  Ruby:
    version: 4.0.7
    path: /opt/homebrew/bin/ruby
npmPackages:
  "@react-native-community/cli":
    installed: 20.2.0
    wanted: 20.2.0
  react:
    installed: 19.3.0
    wanted: 19.3.0
  react-native:
    installed: 0.88.1
    wanted: 0.88.1
  react-native-macos: Not Found
npmGlobalPackages:
  "*react-native*": Not Found
Android:
  hermesEnabled: true
  newArchEnabled: true
iOS:
  hermesEnabled: true
  newArchEnabled: true
```

### Stacktrace or Logs

None. No error is thrown; the offset just keeps moving.

### MANDATORY Reproducer

https://github.com/Nezz/expo-repro/tree/repro/MvcpStaleAnchor

### Screenshots and Videos

A simulator recording of the offset running away after the second "Remove newest" is attached.
