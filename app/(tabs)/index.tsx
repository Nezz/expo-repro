import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [log, setLog] = useState<string[]>([]);
  const prevTop = useRef(insets.top);

  useEffect(() => {
    if (insets.top !== prevTop.current) {
      const entry = `${new Date().toLocaleTimeString()}: top ${prevTop.current} → ${insets.top}`;
      setLog((prev) => [entry, ...prev].slice(0, 30));
      prevTop.current = insets.top;
    }
  }, [insets.top]);

  const isZero = insets.top === 0;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 48) }]}>
      <Text style={styles.title}>Safe Area Insets Bug Repro</Text>
      <Text style={styles.subtitle}>PostHog Session Replay + edgeToEdge + New Arch</Text>

      <View style={[styles.valueBox, isZero && styles.valueBoxError]}>
        <Text style={styles.label}>insets.top</Text>
        <Text style={[styles.value, isZero && styles.valueError]}>{insets.top}</Text>
      </View>

      <View style={styles.insetsRow}>
        <InsetCell label="bottom" value={insets.bottom} />
        <InsetCell label="left" value={insets.left} />
        <InsetCell label="right" value={insets.right} />
      </View>

      <Text style={styles.logTitle}>Change log:</Text>
      {log.length === 0 && <Text style={styles.logEmpty}>Waiting for inset changes...</Text>}
      {log.map((entry, i) => (
        <Text key={i} style={styles.logEntry}>{entry}</Text>
      ))}
    </View>
  );
}

function InsetCell({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1A',
    paddingHorizontal: 24,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 24,
  },
  valueBox: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  valueBoxError: {
    backgroundColor: '#7F1D1D',
  },
  label: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  value: {
    color: '#00D296',
    fontSize: 48,
    fontWeight: '700',
  },
  valueError: {
    color: '#EF4444',
  },
  insetsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  cell: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  cellLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  cellValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  logTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  logEmpty: {
    color: '#6B7280',
    fontSize: 13,
    fontStyle: 'italic',
  },
  logEntry: {
    color: '#D1D5DB',
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
