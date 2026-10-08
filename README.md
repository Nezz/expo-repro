# Reanimated keeps an idle app waking up every frame

A bare React Native 0.86.2 app whose only screen is one `Animated.View` with a static `useAnimatedStyle`:

```tsx
const style = useAnimatedStyle(() => ({ opacity: 1 }));
return <Animated.View style={[{ flex: 1, backgroundColor: 'teal' }, style]} />;
```

Nothing animates and no shared value changes, yet the app never goes idle. Without Reanimated the same app sits at 0 context switches per second.

## Run

```sh
bun install
cd ios && bundle install && bundle exec pod install && cd ..
SIM=<simulator udid> ./run.sh   # Release build (JS bundle embedded, no Metro), install, launch, measure
./measure.sh                    # measure again
```

`measure.sh` reads the app process's context switches from `top` over 10 s with no input. Simulator apps are macOS processes, so no Instruments or device is needed.

Each fix is an opt-in patch to `node_modules`, applied in this order:

```sh
bun run fix:worklets   # worklets: request a UI frame only when a callback or finalizer is queued
bun run fix:mappers    # Reanimated: run mappers when an input changes, not every frame
bun run fix:interval   # Reanimated: settled-props sync every 1.1 s instead of 500 ms
```

## Results

iPhone 17 Pro simulator, iOS 26.5, Xcode 26.6, Release build, context switches per second at rest:

| Build | context switches/s (3 × 10 s) |
|---|---|
| stock | 248, 261, 229 |
| + `fix:worklets` | 215, 226, 237 |
| + `fix:mappers` | 73, 70, 72 |
| + `fix:interval` | 16, 8, 6 |
| all three fixes, `Animated.View` without `useAnimatedStyle` | 10, 6, 6 |
| plain `View`, Reanimated imported, `fix:worklets` + `fix:mappers` | 1, 0 |
| plain `View`, no Reanimated at all | 3, 0, 0 |

## Why

1. **Worklets UI loop** (`react-native-worklets/src/runLoop/uiRuntime/requestAnimationFrame.ts`): `nativeFlushQueue` requests the next frame after every frame, whether or not anything is queued.
2. **Mappers** (`react-native-reanimated/src/mappers.native.ts`): `scheduledMapperRun` re-queues itself as a frame finalizer after every run ("We always run mappers on native"). With 1 fixed alone nothing changes, because this keeps the loop going.
3. **Settled-props sync** (`react-native-reanimated/src/PropsRegistryGarbageCollector.ts`): with `FORCE_REACT_RENDER_FOR_SETTLED_ANIMATIONS` (on by default) every mounted animated component keeps a 500 ms `setInterval` on the JS thread. React Native's `RCTTiming` only lets its display link sleep when the next timer is more than `kMinimumSleepInterval` (1 s) away, so a 500 ms interval keeps `RCTDisplayLink` firing on the JS thread every frame. 1.1 s here only stands in for a real fix, such as running the sync only while there are unsynced updates.
