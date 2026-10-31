# Reload crashes in `Scheduler::uiManagerDidDispatchCommand` on iOS (React Native 0.88.1)

A bare React Native 0.88.1 app (New Architecture, Hermes, debug build). About 1 s after mount, one JS task queues a `ScrollView.scrollTo`, calls `DevSettings.reload()` and keeps the JS thread busy for 100 ms. On an iOS simulator the app crashes on most reloads with `EXC_BAD_ACCESS` on the JS thread, inside the lambda `Scheduler::uiManagerDidDispatchCommand` queued.

```sh
npm install
cd ios && bundle install && bundle exec pod install && cd ..
npx react-native start
npx react-native run-ios      # in a second terminal
```

The app reloads itself after every mount and usually crashes on the first reload. `./loop.sh <label> <trials> [knob=value ...]` launches it once per trial and counts the crashes, e.g. `./loop.sh default 20` or `./loop.sh no-busy 10 busyAfterReloadMs=0`. The knobs are in `CONFIG` in `App.tsx`.

The mechanism, the crash rates, the stack and an lldb trace of the order of events are in `ISSUE.md`. `patches/experiment-Scheduler-registry-check.diff` is the `Scheduler.cpp` experiment it describes, and `lldb-order.txt` with `lldb_order.py` records the lldb trace.
