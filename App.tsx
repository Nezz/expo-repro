import { useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { runOnUISync } from 'react-native-worklets';

const MB = 1024 * 1024;

type Stats = { js_allocatedBytes: number; js_numGCs: number };
declare const HermesInternal: { getInstrumentedStats(): Stats };

// GARBAGE leaves about the same old-generation garbage on both runtimes. Then send a memory trim:
//   adb shell am send-trim-memory com.repro.workletstrim RUNNING_CRITICAL
// (or press Home, which sends TRIM_MEMORY_BACKGROUND), and press STATS.
export default function App() {
  const [log, setLog] = useState<string[]>([]);

  function report(label: string) {
    const line = `${label}: ${describe('RN', HermesInternal.getInstrumentedStats())} | ${describe('UI', runOnUISync(uiStats))}`;
    console.log(`[repro] ${line}`);
    setLog((lines) => [...lines, line]);
  }

  function garbage() {
    makeGarbage();
    runOnUISync(makeGarbage);
    report('after GARBAGE');
  }

  useEffect(() => {
    report('start');
    const subscription = AppState.addEventListener('change', (state) => report(`AppState ${state}`));
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={garbage}>
        <Text style={styles.label}>GARBAGE</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => report('STATS')}>
        <Text style={styles.label}>STATS</Text>
      </Pressable>
      {log.map((line, i) => (
        <Text key={i} style={styles.line}>
          {line}
        </Text>
      ))}
    </View>
  );
}

// The objects live until the array is dropped, so they reach the old generation before they become garbage.
function makeGarbage(): number {
  'worklet';
  const items = [];
  for (let i = 0; i < 400000; i++) {
    items.push({ i, label: `item ${i}` });
  }
  return items.length;
}

function uiStats(): Stats {
  'worklet';
  const { js_allocatedBytes, js_numGCs } = HermesInternal.getInstrumentedStats();
  return { js_allocatedBytes, js_numGCs };
}

function describe(runtime: string, stats: Stats): string {
  return `${runtime} ${(stats.js_allocatedBytes / MB).toFixed(1)} MB, GCs ${stats.js_numGCs}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 80, paddingHorizontal: 16, gap: 12 },
  button: { backgroundColor: '#ddd', padding: 16, alignItems: 'center' },
  label: { fontSize: 18 },
  line: { fontSize: 12 },
});
