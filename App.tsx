import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
} from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { isUIRuntime, scheduleOnRN } from 'react-native-worklets';

// Each pan turns itself off 300 ms after it activates, while the finger is still down.
// Its onDeactivate worklet says which runtime it ran on, then reads Reanimated's frame clock,
// a global that only the UI runtime has.

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatePan />
      <SharedValuePan />
    </GestureHandlerRootView>
  );
}

function StatePan() {
  const [enabled, setEnabled] = useState(true);
  const [ranOn, setRanOn] = useState('-');
  const disableSoon = () => setTimeout(() => setEnabled(false), 300);

  const pan = usePanGesture({
    enabled,
    onActivate: () => {
      scheduleOnRN(disableSoon);
    },
    onDeactivate: () => {
      scheduleOnRN(setRanOn, isUIRuntime() ? 'UI runtime' : 'RN runtime');
      const frameTime = globalThis._getAnimationTimestamp();
      scheduleOnRN(setRanOn, `UI runtime, frame ${Math.round(frameTime)}`);
    },
  });

  return (
    <Box
      gesture={pan}
      title="enabled: React state"
      enabled={enabled}
      ranOn={ranOn}
    />
  );
}

function SharedValuePan() {
  const enabled = useSharedValue(true);
  const [shownEnabled, setShownEnabled] = useState(true);
  const [ranOn, setRanOn] = useState('-');
  const disableSoon = () =>
    setTimeout(() => {
      enabled.set(false);
      setShownEnabled(false);
    }, 300);

  const pan = usePanGesture({
    enabled,
    onActivate: () => {
      scheduleOnRN(disableSoon);
    },
    onDeactivate: () => {
      scheduleOnRN(setRanOn, isUIRuntime() ? 'UI runtime' : 'RN runtime');
      const frameTime = globalThis._getAnimationTimestamp();
      scheduleOnRN(setRanOn, `UI runtime, frame ${Math.round(frameTime)}`);
    },
  });

  return (
    <Box
      gesture={pan}
      title="enabled: SharedValue"
      enabled={shownEnabled}
      ranOn={ranOn}
    />
  );
}

function Box({
  gesture,
  title,
  enabled,
  ranOn,
}: {
  gesture: ReturnType<typeof usePanGesture>;
  title: string;
  enabled: boolean;
  ranOn: string;
}) {
  return (
    <View style={styles.section}>
      <GestureDetector gesture={gesture}>
        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>
        </View>
      </GestureDetector>
      <Text>{`enabled: ${enabled}`}</Text>
      <Text>{`onDeactivate ran on: ${ranOn}`}</Text>
    </View>
  );
}

declare global {
  var _getAnimationTimestamp: () => number;
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: 24, gap: 32 },
  section: { gap: 8 },
  title: { fontWeight: 'bold' },
  box: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#cde',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
