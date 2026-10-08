# expo-video switches a PlayAndRecord session to Playback, silencing the microphone (iOS)

expo-audio records with the session in `PlayAndRecord`. Mounting a **muted** `useVideoPlayer` and calling `play()`
makes expo-video's `VideoManager.setAudioSession()` call `setCategory(.playback, mode: .moviePlayback, …)`. The
recorder keeps reporting `isRecording` and its duration keeps growing, but no microphone input arrives any more: the
meter freezes on its last value.

The screen shows the current `AVAudioSession` category and mode (read by the local module in
`modules/audio-session`), the recorder state and duration, and how long ago the meter last changed.

## Run

```bash
bun install
npx expo run:ios --configuration Release
```

1. Tap **Start recording**. Category is `PlayAndRecord / Default`, and the meter changes every 100 ms.
2. Tap **Play a muted video**. Category becomes `Playback / MoviePlayback` at once, and the meter stops changing
   ("changed N s ago" keeps growing) while the recorder still says it is recording.

## Workaround

Build expo-video from source (`"expo": { "autolinking": { "ios": { "buildFromSource": ["expo-video"] } } }` in
`package.json`) and patch `ios/VideoManager.swift` to leave a `PlayAndRecord` session alone:

```diff
   private func setAudioSession() {
     let audioSession = AVAudioSession.sharedInstance()
+    if audioSession.category == .playAndRecord {
+      return
+    }
```

With that, the category stays `PlayAndRecord / Default` and the meter keeps updating while the video plays.
