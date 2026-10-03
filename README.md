# react-native-drawer-layout 4.2.11: opening the drawer leaves the keyboard up on iOS

Bare React Native 0.86.2 with `@react-navigation/native` 7.5.0 and `@react-navigation/drawer` 7.14.3.

```bash
bun install
cd ios && pod install && cd ..
bun start
bun ios
```

Use a simulator with the software keyboard on (I/O › Keyboard › Connect Hardware Keyboard off).

1. The app opens on New chat, whose input is autofocused, so the keyboard is up.
2. Tap **☰ Menu**. It calls `navigation.openDrawer()` and nothing else.

| react-native-drawer-layout | after opening the drawer |
| --- | --- |
| 4.2.3 | The keyboard goes down. The screen behind the drawer re-mounts on open (`aria-hidden` toggles on a plain `View`, which Fabric flattens), and the input loses focus. |
| 4.2.11 | The keyboard stays up over the drawer and covers its bottom row. A tap on **New chat** lands on the keyboard. |

Switch versions with `overrides` in `package.json`, then `bun install`.
