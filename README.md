# Worklets crash on reload when a new runtime reuses a dead one's address

Reproducer for [software-mansion/react-native-reanimated#11018](https://github.com/software-mansion/react-native-reanimated/issues/11018):
`EXC_BAD_ACCESS` in `jsi::Value::~Value()` from `worklets::cleanupRuntimeAware` on Hermes' finalizer thread during
`Updates.reloadAsync()`.

A blank Expo SDK 58 app with no patches: React Native 0.88.0 (bridgeless), react-native-worklets 0.13.0,
react-native-reanimated 4.7.1. It creates 16 worker runtimes and 3,000 worklets that capture small objects, runs each
on the UI runtime and every worker runtime, then calls `Updates.reloadAsync()` 1.5 s after mount, so it reloads
itself in a loop and shows a launch counter.

## Run

```sh
./loop.sh <booted-simulator-udid> 300
```

`loop.sh` installs the dependencies, runs `expo prebuild`, builds Release for the simulator, installs the app fresh
and polls it. It stops at the first crash and prints the launch count and the faulting stack from the crash report, or
after 300 launches. Add `--no-build` to rerun without building again.

On an iPhone 17 Pro simulator (iOS 26.5, Xcode 27.1), stock crashed 4 times in 383 reloads over 5 runs, after 43, 1,
24 and 16 reloads. The same app with worklets checking an epoch next to each runtime's address ran 897 reloads without
a crash.
