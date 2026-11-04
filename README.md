# expo-router 58: `screenListeners` never hear `removed` (or the last `blur`) of a popped screen

A stock project with `jest-expo` and one test file, `__tests__/screenListeners.test.tsx`.

```sh
npm install
npx jest
```

- **control:** pushing `/detail` gives `['blur index']`. Passes.
- **bug:** popping `/detail` with `router.back()` should give `blur detail` and `removed detail`. It gets `[]`.

Reproduced with expo 58.0.23, expo-router 58.0.30 (also 58.0.29), react-native 0.88.1 and jest-expo 58.0.14 (`package-lock.json`). It's the same in a development build on an iOS 26 simulator and an Android 16 emulator.

Cause: `removed` is emitted only after the route has left the navigator's state, and the navigator's emitter callback looks the event's target up among the current routes only (`react-navigation/core/useNavigationBuilder.js:271`). It returns at line 287 for a key it no longer has, so no `screenListeners` or `listeners` run. The last `blur` of the popped route is dropped the same way.
