# [Android][Fabric] Two commits in one JS task are mounted with their deletes last: `Check failed.` in ReactViewGroup.isViewClipped

## Description

On Android, `FabricMountingManager::executeMount` writes every Delete at the end of a mount batch, even when the
batch holds several transactions merged together. Its own comment says that's wrong:

```cpp
  // FIXME: this optimization is incorrect when multiple transactions are
  // merged together
```

(`ReactAndroid/src/main/jni/react/fabric/FabricMountingManager.cpp:989` in 0.88.1, `:1034` in
0.89.0-nightly-20261031-e57dcb3cc.) When one transaction deletes a view (its View is flattened) and the next creates
it again (unflattened), the Delete runs after the Create and unregisters the live view. With `removeClippedSubviews`
this ends in `IllegalStateException: Check failed.` in `ReactViewGroup.isViewClipped`. `FlatList` turns
`removeClippedSubviews` on by default on Android, so a plain `FlatList` is enough.

React alone merges two transactions: a `setState` in `useLayoutEffect` commits again in the same JS task. From the
0.88.1 source:

1. Each commit's transaction is pulled at once and merged into the surface's pending one
   (`FabricUIManagerBinding::schedulerDidFinishTransaction`, `MountingTransaction::mergeWith`). It's mounted once, at
   the end of the JS task: `Scheduler::uiManagerDidFinishTransaction` schedules a rendering update, which
   `RuntimeScheduler_Modern::updateRendering` runs after the task.
2. The first commit renders view X at `opacity: 1`, so X is flattened: Remove X, move its children into X's parent,
   Delete X. The second renders it at `opacity: 0.8`: Create X, move the children back into X, insert X.
3. `executeMount` emits the Create, because the first transaction already erased X from `allocatedViewTags`.
   `SurfaceMountingManager.createView` skips it, because X's view is still registered. The Delete at the end of the
   batch then unregisters X while X's view is back in the hierarchy with its children. Nothing is logged.
4. The next time X flattens, `removeViewAt` finds no view state for X, and `addViewAt` finds X's children still in X
   (`View already has a parent: [X]`). Its fallback takes them out and marks them "erroneously re-added", so the
   removes that follow are skipped (`removeViewAt tried to remove a React View that was actually reused`). The clipping
   container's `allChildren` keeps children that end up inside X, and the container's next layout or scroll fails
   `check(parent === this)`.

`disableMountItemReorderingAndroid` keeps mount items in mutation order and avoids this. It's off by default, in the
nightly too. `SurfaceMountingManager.updateLayout` has
`TODO T212247085: Make this non-nullable again after rolling out disableMountItemReorderingAndroid` (0.88.1 and the
nightly, `SurfaceMountingManager.kt:846`), so turning the reordering off seems to be the plan.

Our app crashes in production with this on 0.88.0. In our tests the trigger was a card in a horizontal `FlatList`
that became current and stopped being current within about 0.1 s. #57017 (`addViewAt: failed to insert view`) may be
the same crash. #57365 would have made the `check` non-fatal, which hides the crash but not the stale view registry.

## Steps to reproduce

1. Clone the reproducer and run `npm install`.
2. `cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a`, then
   `adb install -r app/build/outputs/apk/release/app-release.apk`. We used an emulator with the Pixel 6 profile and
   the Android 16 (API 36) Google APIs arm64 image.
3. Open the app and tap "one task".

The app (`App.tsx`, no libraries) is a horizontal `FlatList` of 50 cards at `opacity: 0.8`, each a view holding a
`Text` and a `View`. Every 500 ms one card flashes: a timer renders it at `opacity: 1`, and a `useLayoutEffect` sets it
back to 0.8, so both commits come in one JS task. Each card flashes twice, then the list scrolls one card on with
`scrollToIndex`. The flashing card is six cards ahead of the current one, off screen.

**Expected:** no crash and no soft exceptions. **Actual:** the app crashes 2.6 s after the tap, at the second flash of
card #8 (6 of 6 runs). The second flash of card #7, 1 s earlier, logs the same soft exceptions.

Controls, each 300 s with no soft exception and no crash:

- "two tasks": the same two commits, the second from a `setTimeout(…, 0)` in a `useEffect`.
- "collapsable={false}" on the cards, so they never flatten.
- "one task" in a build with `-PkeepMountOrder=true`, where `MainApplication.kt` sets
  `disableMountItemReorderingAndroid` to true.

The mounting-layer half is also a deterministic JVM test:
`cd android && ./gradlew :app:testDebugUnitTest --tests 'com.clippedsubviewsrepro.*'`.
`MergedTransactionMountTest` runs 0.88.1's real `MountingManager`, `SurfaceMountingManager`,
`IntBufferBatchMountItem`, `ReactViewGroup` and `ReactHorizontalScrollView` under Robolectric, with batches in
`executeMount`'s order. A card that becomes current and stops being current in one merged batch stays in the
container with its children, unregistered, and nothing is logged. The next change logs `Unable to find viewState`
and `View already has a parent`, and the one after throws `Check failed.` from `SurfaceMountingManager.updateLayout`,
as on the device. The same transactions in mutation order, or as two batches, log nothing.

## React Native Version

0.88.1

## Affected Platforms

Runtime - Android

## Output of `npx @react-native-community/cli info`

```text
System:
  OS: macOS 26.7.1
  CPU: (12) arm64 Apple M3 Pro
  Memory: 738.73 MB / 36.00 GB
  Shell:
    version: "5.9"
    path: /bin/zsh
Binaries:
  Node:
    version: 24.22.1
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
      - DriverKit 27.0
      - iOS 27.1
      - macOS 27.0
      - tvOS 27.0
      - visionOS 27.0
      - watchOS 27.0
  Android SDK: Not Found
IDEs:
  Android Studio: Not Found
  Xcode:
    version: 27.1/27A9275
    path: /usr/bin/xcodebuild
Languages:
  Java:
    version: 17.0.20.1
    path: /usr/bin/javac
  Ruby:
    version: 4.0.9
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
  hermesEnabled: Not found
  newArchEnabled: false
```

## Stacktrace or Logs

`adb logcat -v threadtime`, release build, from the tap ("beat" is the flash count). Each soft exception is followed by
its stack trace, left out here.

```text
10-31 19:05:19.482  4793  4826 I ReactNativeJS: beat=0 current=0
10-31 19:05:21.027  4793  4826 I ReactNativeJS: beat=3 current=1
10-31 19:05:21.039  4793  4793 E unknown:SurfaceMountingManager:MissingViewState: com.facebook.react.bridge.ReactNoCrashSoftException: Unable to find viewState for tag: [124] for removeViewAt
10-31 19:05:21.039  4793  4793 E unknown:SurfaceMountingManager:MissingViewState: com.facebook.react.bridge.ReactNoCrashSoftException: Unable to find viewState for tag: [124] for removeViewAt
10-31 19:05:21.040  4793  4793 E unknown:SurfaceMountingManager: java.lang.IllegalStateException: addViewAt: cannot insert view [120] into parent [154]: View already has a parent: [124] Parent: ReactViewGroup View: ReactTextView
10-31 19:05:21.040  4793  4793 E unknown:SurfaceMountingManager: java.lang.IllegalStateException: addViewAt: cannot insert view [122] into parent [154]: View already has a parent: [124] Parent: ReactViewGroup View: ReactViewGroup
10-31 19:05:21.040  4793  4793 E unknown:SurfaceMountingManager: com.facebook.react.uimanager.IllegalViewOperationException: removeViewAt tried to remove a React View that was actually reused. This indicates a bug in the Differ (specifically instruction ordering). [122]
10-31 19:05:21.040  4793  4793 E unknown:SurfaceMountingManager: com.facebook.react.uimanager.IllegalViewOperationException: removeViewAt tried to remove a React View that was actually reused. This indicates a bug in the Differ (specifically instruction ordering). [120]
10-31 19:05:21.546  4793  4826 I ReactNativeJS: beat=4 current=2
10-31 19:05:21.589  4793  4793 E unknown:ReactViewGroup.isViewClipped: com.facebook.react.bridge.ReactNoCrashSoftException: View missing clipping tag: index=9 parentNull=false parentThis=false transitioning=true
(the same for index 9 and 10 on each frame of the scroll)
10-31 19:05:22.057  4793  4826 I ReactNativeJS: beat=5 current=2
10-31 19:05:22.074  4793  4793 E unknown:SurfaceMountingManager:MissingViewState: com.facebook.react.bridge.ReactNoCrashSoftException: Unable to find viewState for tag: [136] for removeViewAt
10-31 19:05:22.075  4793  4793 E unknown:SurfaceMountingManager:MissingViewState: com.facebook.react.bridge.ReactNoCrashSoftException: Unable to find viewState for tag: [136] for removeViewAt
10-31 19:05:22.075  4793  4793 E unknown:SurfaceMountingManager: java.lang.IllegalStateException: addViewAt: cannot insert view [132] into parent [154]: View already has a parent: [136] Parent: ReactViewGroup View: ReactTextView
10-31 19:05:22.075  4793  4793 E unknown:SurfaceMountingManager: java.lang.IllegalStateException: addViewAt: cannot insert view [134] into parent [154]: View already has a parent: [136] Parent: ReactViewGroup View: ReactViewGroup
10-31 19:05:22.075  4793  4793 E unknown:SurfaceMountingManager: com.facebook.react.uimanager.IllegalViewOperationException: removeViewAt tried to remove a React View that was actually reused. This indicates a bug in the Differ (specifically instruction ordering). [134]
10-31 19:05:22.075  4793  4793 E unknown:SurfaceMountingManager: com.facebook.react.uimanager.IllegalViewOperationException: removeViewAt tried to remove a React View that was actually reused. This indicates a bug in the Differ (specifically instruction ordering). [132]
10-31 19:05:22.076  4793  4793 E AndroidRuntime: FATAL EXCEPTION: main
10-31 19:05:22.076  4793  4793 E AndroidRuntime: Process: com.clippedsubviewsrepro, PID: 4793
10-31 19:05:22.076  4793  4793 E AndroidRuntime: java.lang.IllegalStateException: Check failed.
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.views.view.ReactViewGroup.isViewClipped(ReactViewGroup.kt:767)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.views.view.ReactViewGroup.updateSubviewClipStatus(ReactViewGroup.kt:562)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.views.view.ReactViewGroup.access$updateSubviewClipStatus(ReactViewGroup.kt:79)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.views.view.ReactViewGroup$ChildrenLayoutChangeListener.onLayoutChange(ReactViewGroup.kt:111)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at android.view.View.layout(View.java:25647)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.fabric.mounting.SurfaceMountingManager.updateLayout(SurfaceMountingManager.kt:859)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.fabric.mounting.mountitems.IntBufferBatchMountItem.execute(IntBufferBatchMountItem.kt:139)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.fabric.mounting.MountItemDispatcher.executeOrEnqueue(MountItemDispatcher.kt:379)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.fabric.mounting.MountItemDispatcher.dispatchMountItems$lambda$7$lambda$6(MountItemDispatcher.kt:269)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.fabric.mounting.MountItemDispatcher$$ExternalSyntheticLambda4.invoke(D8$$SyntheticClass:0)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.internal.tracing.PerformanceTracer.trace(PerformanceTracer.kt:46)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.internal.tracing.PerformanceTracer.trace(PerformanceTracer.kt:35)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.fabric.mounting.MountItemDispatcher.dispatchMountItems(MountItemDispatcher.kt:250)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.fabric.mounting.MountItemDispatcher.tryDispatchMountItems(MountItemDispatcher.kt:94)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.fabric.FabricUIManager$DispatchUIFrameCallback.doFrameGuarded(FabricUIManager.java:1660)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.uimanager.GuardedFrameCallback.doFrame(GuardedFrameCallback.kt:42)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.modules.core.ReactChoreographer.frameCallback$lambda$1(ReactChoreographer.kt:58)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.facebook.react.modules.core.ReactChoreographer$$ExternalSyntheticLambda0.doFrame(D8$$SyntheticClass:0)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at android.view.Choreographer$CallbackRecord.run(Choreographer.java:1568)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at android.view.Choreographer$CallbackRecord.run(Choreographer.java:1579)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at android.view.Choreographer.doCallbacks(Choreographer.java:1179)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at android.view.Choreographer.doFrame(Choreographer.java:1104)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at android.view.Choreographer$FrameDisplayEventReceiver.run(Choreographer.java:1553)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at android.os.Handler.handleCallback(Handler.java:995)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at android.os.Handler.dispatchMessage(Handler.java:103)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at android.os.Looper.loopOnce(Looper.java:248)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at android.os.Looper.loop(Looper.java:338)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at android.app.ActivityThread.main(ActivityThread.java:9067)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at java.lang.reflect.Method.invoke(Native Method)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:593)
10-31 19:05:22.076  4793  4793 E AndroidRuntime: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:932)
```

Card #7's flash doesn't reach the `check`: the container's stale entries are flagged `transitioning=true`, so
`isViewClipped` returns before it. `ReactViewGroup` flags a child that way when it's removed through
`removeViewsInLayout`, which calls `onViewRemoved` before it clears the parent. In one run of an earlier version that
flashed the current card, on screen, the app instead crashed in a scroll with
`Invalid clipping state ... allChildrenCount=50 ... uniqueViewsCount=7`, caused by an `IndexOutOfBoundsException` in
`ViewGroup.addViewInLayout`.

## Reproducer

https://github.com/Nezz/expo-repro/tree/repro/MergedTransactionDeleteOrder

## Screenshots and Videos

None. The app closes 2.6 s after the tap, and the log above shows why.
