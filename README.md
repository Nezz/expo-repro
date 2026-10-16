# react-native-screens: `transitionEnd` never fires when Home is pressed during a push on Android

Expo SDK 57.0.24, React Native 0.86.3, expo-router 57, react-native-screens 4.26.2 (native stack).

```bash
bun install
npx expo run:android --variant release
```

1. Tap "Push details". When the push finishes, the details screen shows `transitionEnd: received`.
2. Relaunch the app, tap "Push details" and press Home while the push animation is still running.
3. Open the app again from the launcher.

Expected: the details screen shows `transitionEnd: received`.

Actual: it stays at `transitionEnd: waiting`, and `transitionEnd` is never logged.

`./home-mid-push.sh <delay>` does steps 2–3 over adb, pressing Home `<delay>` seconds after the push starts
(`./home-mid-push.sh none` doesn't press Home). On a Galaxy A17 (Android 16) release build:

| delay | `waiting`, 4.26.2 | `waiting`, with the fix         |
| ----- | ----------------- | ----------------------------- |
| none  | 0/6               | 0/6                           |
| 0.1 s | 6/6               | 0/6                           |
| 0.2 s | 6/6               | 0/6                           |
| 0.3 s | 3/6               | 0/6                           |

The pushed screen's enter animation ends while its fragment is paused, so `ScreenFragment.dispatchViewAnimationEvent`
takes the `isResumed == false` branch
([ScreenFragment.kt:302](https://github.com/software-mansion/react-native-screens/blob/4.26.2/android/src/main/java/com/swmansion/rnscreens/ScreenFragment.kt#L302))
and dispatches `onDisappear` instead of `onAppear`; nothing dispatches `onAppear` once the fragment resumes.
Remembering that the top screen's enter animation ended while paused, and dispatching `onAppear` from `onResume`,
fixes it.
