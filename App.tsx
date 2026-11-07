import { useEffect, useState } from 'react';
import { Button, Linking, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

// Each "Mount" shows ROWS rows that use useAnimatedStyle; "Unmount" removes them.
// "GC UI runtime" / "GC RN runtime" call globalThis.gc() on Reanimated's UI runtime / the React Native runtime.
// The same actions are reachable by deep link for scripting: retention://toggle, retention://gc-ui, retention://gc-rn.
// Read the app's native memory from outside (see the issue's steps): it stays up after Unmount and an RN GC,
// and drops only after a UI-runtime GC.
const ROWS = 600;

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [unmountedRows, setUnmountedRows] = useState(0);

  const toggle = () => {
    setMounted((wasMounted) => {
      if (wasMounted) {
        setUnmountedRows((n) => n + ROWS);
      }
      console.log(`[repro] ${wasMounted ? 'unmount' : 'mount'} ${ROWS} rows`);
      return !wasMounted;
    });
  };

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const action = url.replace('retention://', '').replace(/\/$/, '');
      if (action === 'toggle') toggle();
      if (action === 'gc-ui') gcUI();
      if (action === 'gc-rn') gcRN();
    });
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
        <Button title={mounted ? `Unmount ${ROWS} rows` : `Mount ${ROWS} rows`} onPress={toggle} />
        <Button title="GC UI runtime" onPress={gcUI} />
        <Button title="GC RN runtime" onPress={gcRN} />
      </View>
      <Text>{`rows unmounted so far: ${unmountedRows}`}</Text>
      <View style={styles.rows}>
        {mounted ? Array.from({ length: ROWS }, (_, i) => <Row key={i} />) : null}
      </View>
    </View>
  );
}

function Row() {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.row, animatedStyle]}>
      <View style={styles.dot} />
      <Text style={styles.label}>row</Text>
    </Animated.View>
  );
}

function gcRN() {
  console.log('[repro] gc on the RN runtime');
  (globalThis as { gc?: () => void }).gc?.();
}

function gcUI() {
  scheduleOnUI(() => {
    'worklet';
    console.log('[repro] gc on the UI runtime');
    (globalThis as { gc?: () => void }).gc?.();
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, gap: 8 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  rows: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden' },
  row: { width: 40, height: 20, flexDirection: 'row', alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'red' },
  label: { fontSize: 8 },
});
