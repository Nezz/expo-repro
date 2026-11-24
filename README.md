# maintainVisibleContentPosition keeps a stale anchor on iOS (React Native 0.88.1)

A bare React Native 0.88.1 app (New Architecture, Hermes). An inverted `FlatList` with a 40 pt header, three 64 pt rows and `maintainVisibleContentPosition={{ minIndexForVisible: 1 }}`. Once one row is left, every commit moves the scroll offset by another row height, and the offset runs away.

```sh
npm install
cd ios && bundle install && bundle exec pod install && cd ..
npx react-native run-ios
```

1. Tap "Remove newest". "Offset" goes to -64 and stays: MVCP keeps the rows where they were.
2. Tap "Remove newest" again. One row is left. "Offset" keeps falling (to several hundred thousand within seconds) and the row leaves the screen.

The anchor also survives while MVCP is off. Relaunch, tap "MVCP: on" to turn it off, tap "Remove newest", then tap "MVCP: off" to turn it back on: the offset jumps to -64 on a commit that moved nothing.

The cause and a suggested fix are in `ISSUE.md`.
