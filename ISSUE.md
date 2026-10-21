# [iOS][Fabric] ScrollView sticky header keeps its old translateY after its layout changes, until the next scroll

## Description

On iOS with the New Architecture, when the layout of a `ScrollView` sticky header (`stickyHeaderIndices`) changes while the scroll view is idle, the header keeps the `translateY` it had for its old layout. It only moves to the right place on the next scroll event. Android is not affected.

We found this in our app: a header docked at the top, then content above it shrank, and the header jumped about 200 pt down over the list until the user touched the scroll view.

In the reproducer, the header is docked at the top and a 400 pt view above it collapses to 0 or expands back to 400. The scroll offset stays the same, and the header's layout `y` changes by 400. After the change:

- Collapse: the header vanishes. It is still translated by the old amount, which is now 400 pt too little, so it sits above the viewport.
- Expand: the header sits 400 pt below the top, over the rows.

A 10 to 20 pt drag snaps it back into place.

The bug doesn't happen when anything else flushes native Animated at the same moment. For example, a `Button` (`TouchableOpacity` starts a native-driven opacity animation) hides it, which is why the reproducer uses `Pressable`.

### Cause

`ScrollViewStickyHeader` builds a new `scrollAnimatedValue.interpolate(...)` node every time `layoutY`, `layoutHeight` or `nextHeaderLayoutY` changes (`Libraries/Components/ScrollView/ScrollViewStickyHeader.js`, the `useEffect` at line 161), then sets it as the `transform` of its `Animated.View`. This creates and connects new native nodes: the interpolation, transform, style and props nodes, then `connectAnimatedNodeToView`.

On iOS, with `cxxNativeAnimatedEnabled` false (the default):

- `RCTNativeAnimatedTurboModule.mm` queues `createAnimatedNode`, `connectAnimatedNodes` and `connectAnimatedNodeToView` with `queueOperationBlock`. They run in `didMountComponentsWithRootTag:` (line 325), which executes the operations but doesn't call `updateAnimations`.
- In `RCTNativeAnimatedNodesManager.mm`, `connectAnimatedNodes:` and `connectAnimatedNodeToView:` only call `setNeedsUpdate`. Nodes are evaluated in `updateAnimations` (line 502). That runs from `flushOperationQueues` (line 287), which runs only for "flushed" operations (`queueFlushedOperationBlock`, line 252: `setAnimatedNodeValue`, `startAnimatingNode`, `stopAnimation`), from the display link while an animation runs, and when a native scroll event drives a value.

So when the ScrollView is idle, nothing evaluates the new nodes, and the header keeps the transform from its previous props node.

A second effect on 0.88: since every native value node streams its value to JS listeners (`AnimatedNode.__ensureUpdateSubscriptionExists`, `Libraries/Animated/nodes/AnimatedNode.js` line 158, used by `AnimatedInterpolation`), the header's own `animatedValueListener` (line 144) now gets the new interpolation's value once it is evaluated. 64 ms later it calls `setTranslateY`, which changes `passthroughAnimatedPropExplicitValues` (line 282). That re-renders the `Animated.View`, which builds a new props, style and transform node chain and connects it to the view with `connectAnimatedNodeToView`, while the old props node gets `restoreDefaultValues`. Nothing evaluates that chain either. A single flush right after the layout change is therefore not enough on 0.88: we logged the native module calls and saw the second `connectAnimatedNodeToView` arrive about 70 ms after the flush, with no flushed operation after it.

With `cxxNativeAnimatedEnabled` on (tested through `RCTReleaseLevel.Canary`, which also turns on other flags), the bug doesn't reproduce.

### Workaround

Send a flushed operation whenever the header's offset node or its passthrough `translateY` changes, by setting a throwaway native-driven value:

```diff
--- a/Libraries/Components/ScrollView/ScrollViewStickyHeader.js
+++ b/Libraries/Components/ScrollView/ScrollViewStickyHeader.js
@@ -265,6 +265,12 @@
     isFabric,
   ]);
 
+  useEffect(() => {
+    if (isFabric) {
+      getFlushValue().setValue(0);
+    }
+  }, [animatedTranslateY, translateY, isFabric]);
+
   const _onLayout = (event: LayoutChangeEvent) => {
     setLayoutY(event.nativeEvent.layout.y);
     setLayoutHeight(event.nativeEvent.layout.height);
@@ -309,6 +315,14 @@
     </Animated.View>
   );
 };
+
+let flushValue: ?Animated.Value = null;
+function getFlushValue(): Animated.Value {
+  if (flushValue == null) {
+    flushValue = new Animated.Value(0, {useNativeDriver: true});
+  }
+  return flushValue;
+}
```

On 0.86, `[animatedTranslateY, isFabric]` was enough, because the listener on the interpolation never got native values there. On 0.88, `translateY` must be a dependency too (see `screenshots/6-original-workaround-after-collapse.png`). The patch is in the reproducer at `patches/workaround-ScrollViewStickyHeader.diff`.

A fix inside React Native would probably be for the iOS module to evaluate updated nodes after it runs the operations queued for a mount, for example by calling `updateAnimations` at the end of `didMountComponentsWithRootTag:`. We haven't verified this on 0.88. The reproducer uses the prebuilt React Native core, so native changes would need a build from source.

## Steps to reproduce

1. Clone the reproducer, run `npm install`, then `cd ios && bundle install && bundle exec pod install`.
2. `npx react-native run-ios` on an iPhone simulator. We used iPhone 17 Pro with iOS 26.5.
3. Scroll down until the blue "Sticky header" docks at the top, then let go and wait for scrolling to stop.
4. Tap "Collapse intro". **Expected:** the header stays docked at the top. **Actual:** the header disappears.
5. Drag the list a few points. The header snaps back to the top.
6. Tap "Expand intro". **Expected:** the header stays docked at the top. **Actual:** the header sits 400 pt lower, over the rows.
7. Drag the list a few points. The header snaps back to the top.

Do step 6 after step 5. Expanding right after a stale collapse lands back on the old value, which happens to be correct.

## React Native Version

0.88.0. We first hit it on 0.86.3.

## Affected Platforms

Runtime - iOS

## Output of `npx @react-native-community/cli info`

```text
System:
  OS: macOS 26.7.1
  CPU: (14) arm64 Apple M4 Max
  Memory: 168.83 MB / 36.00 GB
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
      - DriverKit 25.5
      - iOS 26.5
      - macOS 26.5
      - tvOS 26.5
      - visionOS 26.5
      - watchOS 26.5
  Android SDK: Not Found
IDEs:
  Android Studio: 2025.3 AI-253.30387.90.2532.14935130
  Xcode:
    version: 26.6/17F113
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
    installed: 0.88.0
    wanted: 0.88.0
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

## Stacktrace or Logs

```text
None. There is no error or warning.
```

## Reproducer

REPRO_URL

## Screenshots and Videos

All screenshots are from an iPhone 17 Pro simulator (iOS 26.5) and are in `screenshots/`:

- `0-start.png`: initial state.
- `1-docked.png`: scrolled, with the header docked.
- `2-after-collapse.png`: 5 s after "Collapse intro". The header is gone.
- `3-after-collapse-small-scroll.png`: after a small drag, the header is back.
- `4-after-expand.png`: 5 s after "Expand intro". The header is 400 pt down, over the rows.
- `5-after-expand-small-scroll.png`: after a small drag, the header is back.
- `6-original-workaround-after-collapse.png`: workaround with deps `[animatedTranslateY, isFabric]`. Still broken on 0.88.
- `7-fixed-workaround-after-collapse.png`, `8-fixed-workaround-after-expand.png`: workaround with `translateY` in the deps. Correct.
- `cxx-0-start.png` to `cxx-3-after-expand.png`: with `RCTReleaseLevel.Canary` (`cxxNativeAnimatedEnabled` true). Correct without the workaround.
