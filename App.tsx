import { useEffect } from 'react';
import { Settings, StyleSheet, Text, View } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Canvas, Group, Path, Skia } from 'react-native-skia';

const WIDTH = 390;
const HEIGHT = 280;
const SPACING = 20;
// One spacing per this many ms. At 600 ms a 60 Hz frame moves the lines 5/3 px, which lands on only 3 subpixel offsets
// unless frames come late; at 613 ms, frames land on a new one for every frame of the first few seconds.
const PERIOD_MS = 613;

// Launched with the arguments `-volatile 1`, it draws the same lines from a volatile path.
const isVolatile = String(Settings.get('volatile')) === '1';

const builder = Skia.PathBuilder.Make().setIsVolatile(isVolatile);
for (let i = 0; i <= HEIGHT / SPACING + 1; i++) {
  builder.moveTo(0, i * SPACING);
  builder.lineTo(WIDTH, i * SPACING);
}
const lines = builder.detach();

// Lines scrolling down on the UI thread, as a tuner's grid does.
export default function App() {
  const scroll = useSharedValue(0);
  useEffect(() => {
    scroll.value = withRepeat(withTiming(SPACING, { duration: PERIOD_MS, easing: Easing.linear }), -1, false);
  }, [scroll]);
  const transform = useDerivedValue(() => [{ translateY: scroll.value - SPACING }]);

  return (
    <View style={styles.screen}>
      <Text style={styles.label}>{isVolatile ? 'volatile' : 'non-volatile'} path</Text>
      <Canvas style={styles.canvas}>
        <Group transform={transform}>
          <Path path={lines} style="stroke" strokeWidth={0.5} color="#888" />
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 80, backgroundColor: '#fff' },
  label: { fontSize: 18, textAlign: 'center', marginBottom: 16 },
  canvas: { width: WIDTH, height: HEIGHT },
});
