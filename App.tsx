/**
 * Reload crash in Scheduler::uiManagerDidDispatchCommand (iOS, New
 * Architecture).
 *
 * After mount, one JS task queues a view command (ScrollView.scrollTo), calls
 * DevSettings.reload() and keeps the JS thread busy for a moment. The command's
 * deferred rendering update drains at the end of that task, after the main
 * thread has released the Scheduler it points to.
 *
 * Knobs are in CONFIG. loop.sh overrides them through NSUserDefaults without a
 * rebuild, e.g.
 *   xcrun simctl spawn booted defaults write \
 *     org.reactjs.native.example.ReproducerApp busyAfterReloadMs -int 100
 */

import { useEffect, useRef } from 'react';
import {
  DevSettings,
  ScrollView,
  type ScrollViewInstance,
  Settings,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const CONFIG = {
  // scrollTo commands queued in the reload task.
  commands: numberSetting('commands', 1),
  // Busy-wait after DevSettings.reload(), in the same task.
  busyAfterReloadMs: numberSetting('busyAfterReloadMs', 100),
  // Delay between mount and the reload task.
  reloadDelayMs: numberSetting('reloadDelayMs', 1000),
  // Optional variant: an autofocused TextInput first in the tree, whose
  // unmount cleanup blurs it, followed by treeSize Views.
  focused: numberSetting('focused', 0) === 1,
  treeSize: numberSetting('treeSize', 0),
  // 1: reload on every mount, forever. 0: loop.sh mode, one reload per
  // `trial`; the mount after it records `survivedTrial`.
  autoReload: numberSetting('autoReload', 1) === 1,
};

const mount = numberSetting('mounts', 0) + 1;

export default function App() {
  const scrollRef = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    Settings.set({ mounts: mount });
    if (!CONFIG.autoReload) {
      const trial = numberSetting('trial', 0);
      if (numberSetting('reloadedTrial', -1) === trial) {
        Settings.set({ survivedTrial: trial });
        return undefined;
      }
      Settings.set({ reloadedTrial: trial });
    }
    const timer = setTimeout(() => {
      for (let i = 0; i < CONFIG.commands; i++) {
        scrollRef.current?.scrollTo({ y: i % 2, animated: false });
      }
      DevSettings.reload('repro');
      busyWait(CONFIG.busyAfterReloadMs);
    }, CONFIG.reloadDelayMs);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
      {CONFIG.focused ? (
        <TextInput autoFocus placeholder="Focused input" style={styles.input} />
      ) : null}
      <Text>
        mount {mount}: commands {CONFIG.commands}, busy{' '}
        {CONFIG.busyAfterReloadMs} ms, treeSize {CONFIG.treeSize}
      </Text>
      {Array.from({ length: CONFIG.treeSize }, (_, i) => (
        <View key={i} style={styles.node}>
          {i % 5 === 0 ? <Text style={styles.text}>{i}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

function busyWait(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // spin
  }
}

function numberSetting(key: string, fallback: number): number {
  const value = Settings.get(key);
  return typeof value === 'number' ? value : fallback;
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 80,
    paddingHorizontal: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#888',
    padding: 8,
    marginBottom: 8,
  },
  node: {
    padding: 1,
  },
  text: {
    fontSize: 6,
  },
});
