import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createSerializable } from 'react-native-worklets';

const MB = 1024 * 1024;
const COUNT = 200;
const ONE_MB_STRING = 'x'.repeat(MB);

declare const HermesInternal: { getInstrumentedStats(): Record<string, number> };

// Each run makes COUNT objects that each hold 1 MB of native memory, and drops them at once.
// Read the process's native heap with `adb shell dumpsys meminfo com.repro.workletspressure` after each run.
export default function App() {
  const [log, setLog] = useState(() => [stats('start')]);

  function serializables() {
    for (let i = 0; i < COUNT; i++) {
      createSerializable(ONE_MB_STRING);
    }
    setLog((lines) => [...lines, stats(`createSerializable(1 MB string) x${COUNT}`)]);
  }

  function arrayBuffers() {
    for (let i = 0; i < COUNT; i++) {
      new Uint8Array(MB).fill(1);
    }
    setLog((lines) => [...lines, stats(`new Uint8Array(1 MB) x${COUNT}`)]);
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={serializables}>
        <Text style={styles.label}>SERIALIZE</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={arrayBuffers}>
        <Text style={styles.label}>ARRAYBUFFER</Text>
      </Pressable>
      {log.map((line, i) => (
        <Text key={i} style={styles.line}>
          {line}
        </Text>
      ))}
    </View>
  );
}

function stats(label: string): string {
  const s = HermesInternal.getInstrumentedStats();
  const line = `${label}: RN heap ${(s.js_heapSize / MB).toFixed(1)} MB, external ${(s.js_externalBytes / MB).toFixed(1)} MB, GCs ${s.js_numGCs}`;
  console.log(`[repro] ${line}`);
  return line;
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 80, paddingHorizontal: 16, gap: 12 },
  button: { backgroundColor: '#ddd', padding: 16, alignItems: 'center' },
  label: { fontSize: 18 },
  line: { fontSize: 12 },
});
