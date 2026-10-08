# expo-key-event: no key events under a `fullScreenModal` on iOS

```bash
bun install
npx expo run:ios
```

In the iOS simulator, make sure I/O → Keyboard → Connect Hardware Keyboard is on.

1. On the root screen, type a few letters. "Last key on root" updates.
2. Tap "Open full-screen modal" and type again. "Last key on modal" stays `(none)`, and nothing is logged.

`expo-key-event` adds its first-responder view to `rootViewController.view`. A `fullScreenModal` presentation
removes that view from the window, so the listener can no longer receive hardware key events.
