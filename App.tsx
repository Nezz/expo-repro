import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { Skia, VertexMode } from '@shopify/react-native-skia';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

// 1536 positions + 1536 texture coordinates = 3072 points per call.
const VERTEX_COUNT = 1536;
const ITERATIONS = 300;

export default function App() {
  const [result, setResult] = useState('Tap a button to run on the UI thread');

  const run = (kind: 'objects' | 'float32') => {
    setResult(`Running ${kind}…`);
    scheduleOnUI(benchmark, kind, setResult);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Skia.MakeVertices, {VERTEX_COUNT} positions + {VERTEX_COUNT} texture coordinates
      </Text>
      <Button title="Array of { x, y }" onPress={() => run('objects')} />
      <Button title="Float32Array of x, y" onPress={() => run('float32')} />
      <Text style={styles.result}>{result}</Text>
    </View>
  );
}

function benchmark(kind: 'objects' | 'float32', report: (text: string) => void) {
  'worklet';
  const objects = Array.from({ length: VERTEX_COUNT }, () => ({ x: 0, y: 0 }));
  const objectTexs = Array.from({ length: VERTEX_COUNT }, () => ({ x: 0, y: 0 }));
  const floats = new Float32Array(VERTEX_COUNT * 2);
  const floatTexs = new Float32Array(VERTEX_COUNT * 2);
  const times: number[] = [];
  try {
    for (let frame = 0; frame < ITERATIONS; frame++) {
      for (let i = 0; i < VERTEX_COUNT; i++) {
        const x = (i % 64) * 5 + frame;
        const y = Math.floor(i / 64) * 5;
        if (kind === 'objects') {
          objects[i].x = x;
          objects[i].y = y;
          objectTexs[i].x = y;
          objectTexs[i].y = x;
        } else {
          floats[2 * i] = x;
          floats[2 * i + 1] = y;
          floatTexs[2 * i] = y;
          floatTexs[2 * i + 1] = x;
        }
      }
      const start = performance.now();
      const vertices =
        kind === 'objects'
          ? Skia.MakeVertices(VertexMode.Triangles, objects, objectTexs)
          : // @ts-expect-error Float32Array isn't accepted without the patch
            Skia.MakeVertices(VertexMode.Triangles, floats, floatTexs);
      times.push(performance.now() - start);
      vertices.dispose();
    }
  } catch (error) {
    scheduleOnRN(report, `${kind}: ${String(error)}`);
    return;
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const p90 = times[Math.floor(times.length * 0.9)];
  const text = `${kind}: median ${median.toFixed(3)} ms, p90 ${p90.toFixed(3)} ms over ${ITERATIONS} calls`;
  console.log(`[SkiaVertices] ${text}`);
  scheduleOnRN(report, text);
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 16, fontWeight: '600' },
  result: { fontFamily: 'Menlo', fontSize: 13 },
});
