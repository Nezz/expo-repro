# ScrollView sticky header keeps its old translateY on iOS (React Native 0.88.0)

A bare React Native 0.88.0 app (New Architecture, Hermes). On iOS, a ScrollView sticky header whose layout changes while the scroll view is idle keeps the offset from its old layout until the next scroll.

```sh
npm install
cd ios && bundle install && bundle exec pod install && cd ..
npx react-native run-ios
```

1. Scroll until the blue "Sticky header" docks at the top, and let the scroll stop.
2. Tap "Collapse intro". The header disappears. A small drag brings it back.
3. Tap "Expand intro". The header sits 400 pt lower, over the rows. A small drag snaps it back.

The cause, a workaround (`patches/workaround-ScrollViewStickyHeader.diff`) and screenshots (`screenshots/`) are in `ISSUE.md`.
