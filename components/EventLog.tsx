import { useSyncExternalStore } from 'react';
import { StyleSheet, Text, View } from 'react-native';

let lines: string[] = [];
const listeners = new Set<() => void>();

export function logEvent(message: string) {
  console.log('[repro]', message);
  const time = new Date().toISOString().slice(17, 23);
  lines = [...lines.slice(-9), `${time} ${message}`];
  setTimeout(() => listeners.forEach((listener) => listener()));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function EventLog() {
  const current = useSyncExternalStore(subscribe, () => lines);

  return (
    <View pointerEvents="none" style={styles.log}>
      {current.map((line, index) => (
        <Text key={index} style={styles.line}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  log: { position: 'absolute', left: 8, right: 8, top: 360, padding: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.7)' },
  line: { color: '#a3e635', fontFamily: 'Menlo', fontSize: 11 },
});
