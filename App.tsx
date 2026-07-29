import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MODULE_COUNT } from './modules';

// At module scope: every module in the import graph has been evaluated by now.
const evaluatedMs = Date.now() - (globalThis as { __jsStart?: number }).__jsStart!;
const engine = (globalThis as { HermesInternal?: { getRuntimeProperties?: () => Record<string, unknown> } })
  .HermesInternal?.getRuntimeProperties?.();

console.log(`${MODULE_COUNT} modules evaluated in ${evaluatedMs}ms`);

export default function App() {
  const [firstFrameMs, setFirstFrameMs] = useState<number | null>(null);

  const onLayout = (): void => {
    if (firstFrameMs !== null) return;
    const ms = Date.now() - (globalThis as { __jsStart?: number }).__jsStart!;
    console.log(`first frame ${ms}ms after JS started`);
    setFirstFrameMs(ms);
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Text style={styles.headline}>{firstFrameMs === null ? '—' : `${(firstFrameMs / 1000).toFixed(1)}s`}</Text>
      <Text style={styles.label}>from JS starting to first frame</Text>
      <Text style={styles.detail}>{MODULE_COUNT} modules evaluated in {evaluatedMs}ms</Text>
      <Text style={styles.detail}>
        {engine
          ? `Hermes ${engine['OSS Release Version']}${engine['Static Hermes'] ? ' (Static Hermes)' : ''}`
          : 'not Hermes'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  headline: {
    fontSize: 64,
    fontWeight: '700',
  },
  label: {
    fontSize: 16,
    marginBottom: 24,
  },
  detail: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#444',
  },
});
