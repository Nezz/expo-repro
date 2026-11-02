import { File, Paths } from 'expo-file-system';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { createWorkletRuntime, scheduleOnRuntime, scheduleOnUI } from 'react-native-worklets';

const BOXES = 120;
// Each worklet handed to a runtime is a SerializableJSRef in the RN runtime, holding a jsi::Value per worklet
// runtime it ran on. Hermes finalizes them on its SerialExecutor when the RN runtime is torn down by the reload.
const SCHEDULED_WORKLETS = 3000;
const HEAP_OBJECTS = 300000;
const RELOAD_AFTER_MS = 1500;
const retained: unknown[] = [];
// Worklet runtimes are freed in the old instance and allocated in the new one within a few ms of each other: the
// more of them, the more often a new one lands at a dead one's address while those finalizers still run.
const workers = Array.from({ length: 16 }, (_, i) => createWorkletRuntime({ name: `repro-worker-${i}` }));

export default function App() {
  const [launch] = useState(bumpLaunchCount);

  useEffect(() => {
    for (let i = 0; i < SCHEDULED_WORKLETS; i++) {
      const captured = { index: i, label: `worklet-${i}`, values: [i, i * 2, i * 3] };
      const worklet = () => {
        'worklet';
        (globalThis as Record<string, unknown>).lastScheduled = captured.label + captured.values[2];
      };
      retained.push(worklet);
      scheduleOnUI(worklet);
      for (const worker of workers) scheduleOnRuntime(worker, worklet);
    }
    for (let i = 0; i < HEAP_OBJECTS; i++) retained.push({ i, tag: `object-${i}` });
    const timer = setTimeout(() => Updates.reloadAsync(), RELOAD_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.counter} testID="launch">
        launch {launch}
      </Text>
      <Text>Updates.reloadAsync() every {RELOAD_AFTER_MS} ms</Text>
      <View style={styles.grid}>
        {Array.from({ length: BOXES }, (_, index) => (
          <Box key={index} index={index} />
        ))}
      </View>
    </View>
  );
}

function Box({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const config = { amplitude: 4 + (index % 7), phase: index / BOXES, name: `box-${index}` };
  const scaled = useDerivedValue(() => progress.value * config.amplitude);
  useAnimatedReaction(
    () => scaled.value > config.amplitude / 2,
    (high) => {
      (globalThis as Record<string, unknown>)[config.name] = high;
    },
  );
  const style = useAnimatedStyle(() => ({
    opacity: 0.4 + config.phase * 0.6,
    transform: [{ translateY: scaled.value }],
  }));

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 400 + (index % 5) * 100 }), -1, true);
  }, [index, progress]);

  return <Animated.View style={[styles.box, style]} />;
}

function bumpLaunchCount(): number {
  const file = new File(Paths.document, 'launches.txt');
  const launch = (file.exists ? Number(file.textSync()) : 0) + 1;
  if (!file.exists) file.create();
  file.write(String(launch));
  return launch;
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#3a7', height: 16, margin: 2, width: 16 },
  container: { alignItems: 'center', backgroundColor: '#fff', flex: 1, paddingTop: 80 },
  counter: { fontSize: 32, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, paddingHorizontal: 8 },
});
