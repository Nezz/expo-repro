# react-native-keyboard-controller: a hidden status bar comes back for good after a swipe on Android

Expo SDK 57.0.24, React Native 0.86.3 (New Architecture, edge-to-edge), react-native-keyboard-controller 1.22.6
(1.22.7 and main are the same), react-native-reanimated 4.5.1. Seen on an Android 14 tablet emulator and an Android 16
phone emulator, in landscape and portrait.

```bash
bun install
npx expo run:android --variant release
```

1. Open the app. The screen renders `<StatusBar hidden />` from `react-native`, and the status bar is hidden.
2. Swipe down a short way from the top edge to reveal the bars (`adb shell input swipe <x> 2 <x> 150 150`). If the
   notification shade opens, close it (`adb shell cmd statusbar collapse`).
3. Wait 5 seconds.

No `KeyboardProvider` is needed: linking the library is enough. Wrapping the screen in one behaves the same.

Expected: the status bar shows transiently and hides again after a few seconds, as it does with the library removed
(`bun remove react-native-keyboard-controller`, rebuild).

Actual: the status bar stays visible.

The library's `StatusBarManagerCompat` replaces React Native's `StatusBarManager` whenever it is linked, and its
`setHidden(true)` hides the status bar without setting `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`
(`android/src/main/java/com/reactnativekeyboardcontroller/modules/statusbar/StatusBarManagerCompatModuleImpl.kt:33-34`),
so the window keeps `BEHAVIOR_DEFAULT` and a swipe clears the hide. React Native's own module sets that behavior first
(`ReactAndroid/src/main/java/com/facebook/react/views/view/WindowUtil.kt:130-133`). Setting it the same way before `hide` fixes it.
