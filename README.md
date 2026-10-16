# react-native-youtube-bridge: player commands sent from a `ready` listener are dropped

Expo SDK 57.0.24, React Native 0.86.3, react-native-youtube-bridge 2.2.3, react-native-webview 13.16.1.

```bash
bun install
npx expo run:ios
```

1. Launch the app and wait for the video to load. The screen's `ready` listener calls `player.seekTo(60)`.
2. Read the current time shown under the player, which is fetched 2 s after `ready`.

Expected: about 60 s. The video starts at 1:00.

Actual: 0.0. The seek never reaches the player. `setPlaybackRate`, `play` and every other command called from the listener are dropped in the same way.

On native, `YoutubeView` emits `ready` straight from the WebView message ([`src/YoutubeView.tsx:83-85`](https://github.com/react-native-bridges/react-native-youtube-bridge/blob/main/packages/react-native-youtube-bridge/src/YoutubeView.tsx#L83-L85)),
but only attaches the controller in an effect after the next render (`:142-148`). Until then `YoutubePlayer`'s methods call `this.controller?.…` on `null`. The web `YoutubeView` attaches the controller before creating the player, so it is not affected.
