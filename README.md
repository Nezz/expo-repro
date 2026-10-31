# Two commits in one JS task are mounted with their deletes last on Android (React Native 0.88.1)

A bare React Native 0.88.1 app (New Architecture, Hermes, no libraries). A `setState` in a `useLayoutEffect` makes
React commit twice in one JS task. Android mounts both commits as one batch with every delete moved to its end
(`FabricMountingManager::executeMount`, "FIXME: this optimization is incorrect when multiple transactions are merged
together"), so a View that is flattened and unflattened in that task loses its registration while it stays on screen.
In a `FlatList`, which clips subviews by default on Android, the app crashes with `IllegalStateException: Check
failed.` in `ReactViewGroup.isViewClipped`.

```sh
npm install
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/release/app-release.apk
```

1. Open the app and tap "one task". It crashes about 3 s later.
2. Controls: "two tasks" and "collapsable={false}" keep running without an error, and so does "one task" in a build
   with `-PkeepMountOrder=true`, which turns on `disableMountItemReorderingAndroid`.
3. The mounting-layer half as a JVM test:
   `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.clippedsubviewsrepro.*'`.

The cause, the logs and the runs are in `ISSUE.md`.
