# [iOS][Fabric] Reload crashes on the JS thread in `Scheduler::uiManagerDidDispatchCommand` after the Scheduler is freed (EXC_BAD_ACCESS)

## Description

On iOS with the New Architecture (bridgeless), reloading the app while a view command is still queued crashes it on the JS thread with `EXC_BAD_ACCESS`. The crash is inside the lambda that `Scheduler::uiManagerDidDispatchCommand` passes to `RuntimeScheduler::scheduleRenderingUpdate`, called from `RuntimeScheduler_Modern::updateRendering`.

The reproducer is a bare React Native 0.88.1 app with a single `ScrollView`. About 1 s after mount, one JS task does this:

```tsx
scrollRef.current?.scrollTo({ y: 0, animated: false });
DevSettings.reload();
busyWait(100); // keeps the JS thread in this task for 100 ms
```

It crashed on 20 of 20 reloads with the default setup (debug build, prebuilt `React.xcframework`, iPhone 17 simulator, iOS 26.5), and on 34 of 40 with React Native built from source. Without the `scrollTo`, or without the busy time, it crashed on 0 of 10.

The same crash was reported in #58601 and #53774.

It also happens in production. Our app (RN 0.88.0, Expo SDK 58, bridgeless, release build) crashes with the same JS-thread stack within 1 s of expo-updates' `Updates.reloadAsync()`, which reloads through the same `RCTHost` path. In one of those reports the main thread was still in `-[RCTHost _reloadWithShouldRestartSurfaces:]`, building the new `RCTInstance` and `Scheduler`.

### Mechanism

From the 0.88.1 source and the lldb run below:

1. `uiManagerDidDispatchCommand` doesn't call the delegate directly. It queues a rendering update that captures the raw `delegate_` pointer (`Scheduler.cpp`, line 332: `[delegate = delegate_, ...]() { delegate->schedulerDidDispatchCommand(...); }`). The update runs in `RuntimeScheduler_Modern::updateRendering` at the end of the current JS task. `uiManagerDidFinishTransaction` queues a lambda with the same capture when `mountSynchronously` is false.
2. `DevSettings.reload()` makes the main thread run `-[RCTInstance invalidate]`, which first calls `[_surfacePresenter suspend]` (`RCTInstance.mm`, line 229). That stops the surface (`UIManager::stopSurface`) and releases the `RCTScheduler`. Releasing it frees the `Scheduler` and its `SchedulerDelegateProxy`, the `delegate_` in the lambda.
3. If the JS thread is still in the task that queued the command when that happens, it reaches `updateRendering` afterwards and calls `schedulerDidDispatchCommand` on freed memory. The busy time just keeps the JS task running long enough for the main thread to win this race. In a real app the rest of the task's work does the same.

Nothing invalidates or checks the queued updates when the Scheduler goes away. #58138 removed the opt-in guard for this window. Its description says the window "is genuinely left open".

As an experiment (not a proposed fix), both lambdas in `Scheduler.cpp` also captured `uiManager = uiManager_` and the `surfaceId`, and called the delegate only if `uiManager->getShadowTreeRegistry().visit(surfaceId, [](const ShadowTree&) {})` returned true. `UIManager::stopSurface` has already removed the shadow tree when the update runs. With that change it crashed on 0 of 20 reloads, and on 10 of 10 again after reverting it. The diff is `patches/experiment-Scheduler-registry-check.diff` in the reproducer.

### Rates

Each trial launches the app, which reloads once. It counts as a crash if the process dies before the next mount. `loop.sh` runs the trials and sets the knobs through `NSUserDefaults`.

| Variant | Crashes / reloads |
|---|---|
| 1 `scrollTo` queued, `reload()`, JS busy 100 ms (the default), default prebuilt `React.xcframework` | 20 / 20 |
| same, React Native built from source (`RCT_USE_PREBUILT_RNCORE=0`) | 34 / 40 (9/10, 15/20, 10/10) |
| same, JS busy 50 ms | 8 / 10 |
| same, JS busy 20 ms | 7 / 10 |
| same, no busy time | 0 / 10 |
| no command queued, JS busy 100 ms | 0 / 10 |
| an autofocused `TextInput` and 3000 Views, nothing queued, no busy time | 0 / 10 |
| from source, with the `Scheduler.cpp` registry check above | 0 / 20 |

All rows after the first used the from-source build, and are the same app with the knobs changed.

## Steps to reproduce

1. Clone the reproducer and install it:
   ```sh
   npm install
   cd ios && bundle install && bundle exec pod install && cd ..
   ```
2. Start Metro with `npx react-native start`, then build and run on an iOS simulator with `npx react-native run-ios`.
3. The app reloads itself about 1 s after every mount, and usually crashes on the first reload. To count the crashes, quit the app and run `./loop.sh default 20`. It relaunches the app for each trial and prints `default: N crashes in 20 reloads`.

## React Native Version

0.88.1

## Affected Platforms

Runtime - iOS

## Output of `npx @react-native-community/cli info`

```text
System:
  OS: macOS 26.7.1
  CPU: (14) arm64 Apple M4 Pro
  Memory: 11.90 GB / 48.00 GB
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
  hermesEnabled: true
  newArchEnabled: true
```

## Stacktrace or Logs

Crashed thread from the simulator's `.ips` report, with React Native built from source (`RCT_USE_PREBUILT_RNCORE=0`) for source lines. The default prebuilt `React.xcframework` gives the same frames in the `React` image, without line numbers.

```text
Exception: EXC_BAD_ACCESS (SIGBUS) KERN_PROTECTION_FAILURE at 0x00000001090a659c
Crashed thread: com.facebook.react.runtime.JavaScript
0   ???                          0x1090a659c
1   ReproducerApp.debug.dylib    std::__invoke<facebook::react::Scheduler::uiManagerDidDispatchCommand(...)::$_0&>(...) (invoke.h:90)
2   ReproducerApp.debug.dylib    std::__invoke_void_return_wrapper<void, true>::__call<...uiManagerDidDispatchCommand(...)::$_0&>(...) (invoke.h:350)
3   ReproducerApp.debug.dylib    std::__invoke_r<void, ...uiManagerDidDispatchCommand(...)::$_0&>(...) (invoke.h:356)
4   ReproducerApp.debug.dylib    std::__function::__func<facebook::react::Scheduler::uiManagerDidDispatchCommand(...)::$_0, void ()>::operator()() (function.h:172)
5   ReproducerApp.debug.dylib    std::__function::__value_func<void ()>::operator()() const (function.h:273)
6   ReproducerApp.debug.dylib    std::function<void ()>::operator()() const (function.h:754)
7   ReproducerApp.debug.dylib    facebook::react::RuntimeScheduler_Modern::updateRendering(facebook::jsi::Runtime&, facebook::react::HighResTimeStamp) (RuntimeScheduler_Modern.cpp:400)
8   ReproducerApp.debug.dylib    facebook::react::RuntimeScheduler_Modern::runEventLoopTick(facebook::jsi::Runtime&, facebook::react::Task&) (RuntimeScheduler_Modern.cpp:343)
9   ReproducerApp.debug.dylib    facebook::react::RuntimeScheduler_Modern::runEventLoop(facebook::jsi::Runtime&) (RuntimeScheduler_Modern.cpp:287)
10  ReproducerApp.debug.dylib    facebook::react::RuntimeScheduler_Modern::scheduleEventLoop()::$_0::operator()(facebook::jsi::Runtime&) const (RuntimeScheduler_Modern.cpp:272)
```

lldb, attached to the same build, stops on the same thread inside the lambda, at the call through the captured delegate (`Scheduler.cpp:336`, `delegate->schedulerDidDispatchCommand(shadowView, commandName, args);`):

```text
* thread #9, name = 'com.facebook.react.runtime.JavaScript', stop reason = EXC_BAD_ACCESS (code=1, address=0x0)
  * frame #0: 0x0000000000000000
    frame #1: ReproducerApp.debug.dylib`facebook::react::Scheduler::uiManagerDidDispatchCommand(...)::$_0::operator()(this=0x000000010f301508) const at Scheduler.cpp:336:21
    ...
    frame #8: ReproducerApp.debug.dylib`facebook::react::RuntimeScheduler_Modern::updateRendering(...) at RuntimeScheduler_Modern.cpp:400:7
    frame #9: ReproducerApp.debug.dylib`facebook::react::RuntimeScheduler_Modern::runEventLoopTick(...) at RuntimeScheduler_Modern.cpp:343:3
    frame #10: ReproducerApp.debug.dylib`facebook::react::RuntimeScheduler_Modern::runEventLoop(...) at RuntimeScheduler_Modern.cpp:287:5
```

The order of events in that run with breakpoints on `UIManager::stopSurface`, `Scheduler::uiManagerDidDispatchCommand`, `-[RCTScheduler dealloc]` and `RuntimeScheduler_Modern::updateRendering` (enabled after `stopSurface`). Each line is a breakpoint hit with its thread, written by a Python callback (`lldb-order.txt`, `lldb_order.py`):

```text
+  0 ms  #9 com.facebook.react.runtime.JavaScript Scheduler::uiManagerDidDispatchCommand "scrollTo"
+ 20 ms  #1 com.apple.main-thread UIManager::stopSurface
+ 34 ms  #1 com.apple.main-thread -[RCTScheduler dealloc]
+ 57 ms  #15 com.facebook.react.runtime.JavaScript RuntimeScheduler_Modern::updateRendering
+ 68 ms  #15 com.facebook.react.runtime.JavaScript RuntimeScheduler_Modern::updateRendering
+ 79 ms  #15 com.facebook.react.runtime.JavaScript RuntimeScheduler_Modern::updateRendering
+ 91 ms  #15 com.facebook.react.runtime.JavaScript RuntimeScheduler_Modern::updateRendering
+102 ms  #15 com.facebook.react.runtime.JavaScript RuntimeScheduler_Modern::updateRendering
+112 ms  #9 com.facebook.react.runtime.JavaScript RuntimeScheduler_Modern::updateRendering
+121 ms  #9 com.facebook.react.runtime.JavaScript stop: EXC_BAD_ACCESS (code=1, address=0x0)
```

The old JS thread (#9) queues `scrollTo`. The main thread then stops the surface and frees the `RCTScheduler`. The new instance's JS thread (#15) is already running its own event loop when the old JS thread finishes its busy task, reaches `updateRendering`, and faults in the queued lambda.

## MANDATORY Reproducer

https://github.com/Nezz/expo-repro/tree/repro/ReloadSchedulerCrash

## Screenshots and Videos

`reload-loop-crash.mp4` (attached): four trials of `loop.sh` on the simulator. Each launch mounts, reloads ("Downloading 100%...") and drops back to the home screen.
