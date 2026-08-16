# expo-glass-effect: glass never renders when an ancestor fades in

Minimal reproduction for https://github.com/expo/expo/issues/41024.

A `GlassView` whose ancestor animates opacity from `0` to `1` never renders its
glass effect — not during the fade, and not after the ancestor is fully opaque.
It stays a plain transparent view for the life of the mount.

## Reproduce

```bash
bun install
bun start --port 8090
```

then, in another shell:

```bash
bun ios --no-bundler --port 8090
```

The screen shows a `GlassView` that is never animated, then two grids of twelve
that each fade in from opacity 0 — one driven by react-native's `Animated`, the
other by `react-native-reanimated`. The failure is stochastic, so the grids run
the same fade twelve times over: one screenshot is one sample per tile.

The control renders. Most or all of the fading tiles do not, under both
animation libraries. "Run again" remounts everything for a fresh set of samples.

"Leave screen" detaches the grids from the window and puts them back, which is
the path from https://github.com/expo/expo/issues/43732.

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

## Fix

Hold the install back until the view is actually visible, waiting on a display
link while it is not, and tear that link down when the view leaves the window.
Views that are visible when they are laid out install exactly as before.

With that patch applied to `expo-glass-effect`, every tile in both grids renders
on every run, including cold launches, and the detach/re-attach path still
recovers its glass.

## What this narrows down

- The opacity **value** is not what matters. Glass renders at every static
  opacity tested, down to 0.05. What matters is only whether alpha is zero at
  the single moment the effect is installed.
- The view is not permanently broken. Any fresh install — a `glassEffectStyle`
  change, or a window re-attach — brings the effect back.
- The fade runs for 1.5s here to make it deterministic. At a realistic 200ms it
  fails only every few runs, which is what makes this hard to spot in a real
  app: it looks like a random glitch.
- `withInitialValues({ opacity: 0.01 })`, suggested in #41024 to keep the view
  from ever hitting exactly `0`, does **not** reliably help — 0.01 sits on the
  boundary and fails as often as not. Around 0.02 it starts to hold.
- Reproduced with `react-native`'s `Animated` under both `useNativeDriver: true`
  and `false`, and with `react-native-reanimated`. #41024 reports the same with
  `callstack/liquid-glass`, which is an independent implementation.

## Environment

- expo 57.0.13, react-native 0.86.2, expo-glass-effect 57.0.1
- react-native-reanimated 4.5.1, react-native-screens
- iOS 26.4 simulator, iPhone 17 Pro
- `npx expo-doctor`: 21/21 checks passed
