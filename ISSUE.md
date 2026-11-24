### Description

On iOS (Fabric), `maintainVisibleContentPosition` keeps shifting the scroll offset by the same amount on every commit
once the ScrollView has no more than `minIndexForVisible` children: the content runs off the screen and stays there.

`RCTScrollViewComponentView` records its anchor in `_prepareForMaintainVisibleScrollPosition` before each mount
(`_firstVisibleView`, `_prevFirstVisibleFrame`), and `_adjustForMaintainVisibleContentPosition` adds the anchor's
movement to `contentOffset` after it. When `minIndexForVisible >= _contentView.subviews.count`, prepare finds no
subview and returns without touching the anchor (in 0.88.1 the `for` loop doesn't run, at
`RCTScrollViewComponentView.mm:1069`; on `main` at c652e84272 an explicit
`if ((NSUInteger)minIndex >= subviews.count) return;` at line 1250). The anchor from the last commit that had enough
children stays. If that view is still mounted, keeps its tag and has moved, none of adjust's guards stop it
(`!_firstVisibleView`, the tag check, the `superview` check), so it applies
`newFrame.origin - _prevFirstVisibleFrame.origin` again. Since `_prevFirstVisibleFrame` is never refreshed, it does so
on every later mounting transaction in the surface. Adjusting the offset dispatches a scroll event, so a list whose
`onScroll` sets state runs away on its own.

The common trigger is a `FlatList` with a `ListHeaderComponent`: `VirtualizedList` adds 1 to `minIndexForVisible` for
the header (`VirtualizedList.js:1131-1133`), so `{ minIndexForVisible: 1 }` reaches native as 2, and a list going from
two rows to one (header + 1 cell = 2 subviews) leaves the remaining cell as a stale anchor that moved by the removed
row's height.

The anchor also survives while `maintainVisibleContentPosition` is off, since prepare returns before touching it. Turn
MVCP off, remove a row, turn MVCP back on, and the commit that turns it on applies the removed row's height once, though
nothing moved in that commit.

In our app (an inverted chat list), editing an earlier message so that one message was left sent the offset to about
-18000 pt.

Expected: when no subview reaches `minIndexForVisible`, there's no anchor, and the next mount adjusts nothing.

Suggested fix: clear the anchor at the very top of `_prepareForMaintainVisibleScrollPosition`, before the props guard,
so a prepare that finds no view leaves none, and turning MVCP back on starts without one:

```objc
- (void)_prepareForMaintainVisibleScrollPosition
{
  _firstVisibleView = nil;
  const auto &props = static_cast<const ScrollViewProps &>(*_props);
  ...
```

We tried it on 0.88.1 built from source (Release): with the line, the offset stayed at -64 after the second removal in
5 of 5 runs, and the variant below left it at 0 in 5 of 5. The same source build without it ran away in 3 of 3 and
jumped to -64 in 3 of 3.

Related, but different triggers: #52757 and its PR #52782 (an anchor that's removed and recycled for another item,
which the tag check now covers); #58578 (an anchor delta applied after UIKit clamps the offset); #58913 (an anchor on
a `VirtualizedList` spacer that straddles the top edge).

### Steps to reproduce

1. Clone the reproducer, `npm install`, `cd ios && bundle install && bundle exec pod install`, then
   `npx react-native run-ios`.
2. The screen shows "Offset: 0", "Remove newest", "Re-render (0)", "MVCP: on" and an inverted `FlatList` with a 40 pt
   header and three 64 pt rows, with `maintainVisibleContentPosition={{ minIndexForVisible: 1 }}`.
3. Tap "Remove newest". The offset goes to -64 and stays: MVCP keeps the rows in place, as it should.
4. Tap "Remove newest" again. The list now has the header and one row.

Expected: the offset moves by -64 once more, or not at all, and then stays put. "oldest" stays on screen.

Actual: every commit adds another -64. The list's `onScroll` sets state, which is itself a commit, so the offset runs
away without any further taps, and "oldest" leaves the screen. On an iOS 27.1 simulator it happened in 10 of 10 runs in
Debug and 10 of 10 in Release: about 2 s after step 4 the offset was between -616960 and -697792 in Debug and between
-1560512 and -2015744 in Release, and still falling.

Variant (the anchor surviving while MVCP is off): relaunch, tap "MVCP: on" (it turns MVCP off), tap "Remove newest",
then tap "MVCP: off" (back on). Expected: the offset stays 0. Actual: it jumps to -64 when MVCP turns on, in 5 of 5
runs in Debug and 5 of 5 in Release.

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

```text
None: no error. In lldb (in our app), _firstVisibleView stays the same view (same tag, still in _contentView) across commits while
_prevFirstVisibleFrame.origin.y stays 64 pt above its frame, and contentOffset.y drops by 64 on every
mountingTransactionDidMount.
```

### MANDATORY Reproducer

https://github.com/Nezz/expo-repro/tree/repro/MvcpStaleAnchor

### Screenshots and Videos

A simulator recording of the offset running away after the second "Remove newest" is attached.
