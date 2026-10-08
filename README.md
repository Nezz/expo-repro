# Rive: paused view keeps requesting vsync on Android

`@rive-app/react-native` 0.5.4, new (experimental) Android backend, Expo SDK 57 / RN 0.86.3.

- `/` has no Rive view.
- `/paused` plays `rewards.riv` (from the library's example app) for a second, then calls `pause()`.

## Run

```sh
bun install
npx expo run:android --variant release
scripts/run.sh 3
```

`scripts/run.sh` cold-starts the app and, for each state, measures 10 s on the main
thread with `scripts/measure.sh`: `Choreographer#doFrame` callbacks (atrace), wakeups
(voluntary + involuntary context switches) and CPU time. "bg" means after pressing Home.

## Suggested fix

`patches/@rive-app%2Freact-native@0.5.4.patch` is not applied by default. To apply it,
add this to `package.json`, run `bun install` and rebuild:

```json
"patchedDependencies": {
  "@rive-app/react-native@0.5.4": "patches/@rive-app%2Freact-native@0.5.4.patch"
}
```
