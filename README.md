# expo-glass-effect: glass never renders when an ancestor fades in

Minimal reproduction for https://github.com/expo/expo/issues/41024.

A `GlassView` whose ancestor animates opacity from `0` to `1` never renders its
glass effect — not during the fade, and not after the ancestor is fully opaque.
It stays a plain transparent view for the life of the mount.

## Reproduce

```bash
bun install
bun ios
```

The app shows three `GlassView`s over a striped background:

| Case | Setup | Result |
| --- | --- | --- |
| 1 | No opacity animation | Glass renders |
| 2 | Ancestor fades `0 → 1` over 1.5s | **No glass, ever** |
| 3 | Same fade, `glassEffectStyle` held at `'none'` and switched to `'regular'` when the fade ends | Nothing during the fade, then glass renders |

"Run again" remounts all three.

## What this narrows down

- It is the **first layout under a transparent ancestor** that kills the effect,
  not the animation as such. Case 3 runs exactly the same fade and renders fine,
  because the effect is only switched on once the ancestor is opaque.
- The view recovers if the effect is applied later — the native view is not
  permanently broken, only the effect applied during the fade is lost.
- The fade duration is 1.5s here to make it deterministic. At a realistic 200ms
  case 2 fails only every few runs, which is what makes this hard to spot in a
  real app: it looks like a random glitch.
- `withInitialValues({ opacity: 0.01 })`, sometimes suggested to keep the view
  from ever hitting exactly `0`, does **not** help. 0.01 fails the same way.
- Reproduced with `react-native`'s `Animated` (used here, so the repro has no
  extra dependencies) and with `react-native-reanimated`'s `FadeIn` and
  `useAnimatedStyle`.

## Environment

- expo 57.0.13, react-native 0.86.2, expo-glass-effect 57.0.1
- iOS 26.4 simulator, iPhone 17 Pro
- `npx expo-doctor`: 21/21 checks passed
