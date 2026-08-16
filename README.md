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

## Root cause

Instrumenting `GlassView.swift` with a log in `layoutSubviews`, `didMoveToWindow`,
`applyGlassStyle` and `updateEffect` shows the mechanism:

- The `UIGlassEffect` is installed exactly once, on the first `layoutSubviews`
  after the view enters a window, latched by `isMounted`.
- If the view's effective alpha is `0` at that instant, UIKit does not
  materialise the glass. The install silently does nothing.
- Nothing installs it again. `glassStyle` is unchanged, so `applyGlassStyle`
  early-returns, and `updateEffect` is only reached again on a prop change or a
  window re-attach.

Side-by-side, the only difference between a view that renders and one that does
not is the ancestor's alpha at that one moment:

```
static  layoutSubviews ancestorAlpha=1.000 → effect installed → glass
fading  layoutSubviews ancestorAlpha=0.000 → effect installed → nothing, ever
```

A view mounted at `opacity: 0` and later set to `1` does recover, but only by
accident: `opacity: 1` makes the wrapper flattenable, so Fabric removes it and
re-parents the glass view, which resets `isMounted` and re-installs the effect
at full alpha.

That explains the rest of the behaviour. The `glassEffectStyle` workaround works
because a style change forces a fresh install. Starting the fade above zero works
because alpha is non-zero at first layout. The animation driver is irrelevant,
since neither driver changes the shadow tree. And it is intermittent because it
is a race between the animation's first frame and the first layout pass.

A fix would be for the module to stop treating the first install as final — for
example re-applying the effect on a later layout if the install happened at zero
effective alpha.

## What this narrows down

- The opacity **value** is not what matters. Glass renders at every static
  opacity tested, down to 0.05. What matters is only whether alpha is zero at
  the single moment the effect is installed.
- The view is not permanently broken. Any fresh install — a `glassEffectStyle`
  change, or a window re-attach — brings the effect back.
- The fade duration is 1.5s here to make it deterministic. At a realistic 200ms
  it fails only every few runs, which is what makes this hard to spot in a real
  app: it looks like a random glitch.
- `withInitialValues({ opacity: 0.01 })`, suggested in #41024 to keep the view
  from ever hitting exactly `0`, does **not** reliably help — 0.01 sits on the
  boundary and fails as often as not.
- Reproduced with `react-native`'s `Animated` under both `useNativeDriver: true`
  and `false`. #41024 reports the same with `react-native-reanimated` and with
  `callstack/liquid-glass`, which is an independent implementation.

## Environment

- expo 57.0.13, react-native 0.86.2, expo-glass-effect 57.0.1
- iOS 26.4 simulator, iPhone 17 Pro
- `npx expo-doctor`: 21/21 checks passed
