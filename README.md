# react-native-drawer-layout 4.2.11: the keyboard stays up over the drawer on iOS

Expo SDK 57 · expo-router 57.0.10 · react-native 0.86.2 · reanimated 4.5.3 · gesture-handler 2.32.0

```bash
bun install
npx expo run:ios
```

Use a simulator with the software keyboard on (I/O › Keyboard › Connect Hardware Keyboard off).

1. The app opens on New chat, whose input is autofocused, so the keyboard is up.
2. Tap **☰ Menu**. It calls `navigation.openDrawer()` and nothing else.

| drawer | after opening the drawer |
| --- | --- |
| 4.2.3 | The keyboard goes down. The screen behind the drawer re-mounts on open (`aria-hidden` toggles on a plain `View`, which Fabric flattens), and the input loses focus. |
| 4.2.11 | The keyboard stays up over the drawer and covers its bottom row. A tap on **New chat** lands on the keyboard. |

Switch versions with `overrides` in `package.json`, then `bun install`.

The drawer itself opens and closes correctly on both versions. With `Keyboard.dismiss()` before `openDrawer()`, New chat
closes the drawer every time on 4.2.11 (`maestro test .maestro/new-chat.yaml`: 40/40 presses, release and dev builds).
