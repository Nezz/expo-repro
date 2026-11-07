import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

// Remounts one small <Svg> REMOUNTS times, 10 per second, then stops. Pick what it draws with the link that starts it:
//   adb shell am start -W -a android.intent.action.VIEW -d svgrepro://text com.repro.svgtextremount  (an SVG <Text>)
//   adb shell am start -W -a android.intent.action.VIEW -d svgrepro://path com.repro.svgtextremount  (a <Path>, control)
//   adb shell am start -W -a android.intent.action.VIEW -d svgrepro://idle com.repro.svgtextremount  (nothing remounts)
// then read the native heap: adb shell dumpsys meminfo com.repro.svgtextremount | grep 'Native Heap'
const REMOUNTS = 300;

type Mode = 'text' | 'path' | 'idle';

export default function App() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    void Linking.getInitialURL().then((url) => {
      const host = url?.replace('svgrepro://', '').replace(/\/$/, '');
      setMode(host === 'text' || host === 'path' ? host : 'idle');
    });
  }, []);

  useEffect(() => {
    if (mode === null || mode === 'idle') {
      return;
    }
    const timer = setInterval(() => {
      setCount((n) => {
        if (n + 1 >= REMOUNTS) {
          clearInterval(timer);
          console.log(`[repro] ${mode}: ${REMOUNTS} remounts done`);
        }
        return n + 1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [mode]);

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{`${mode ?? '...'}: ${count} / ${mode === 'idle' ? 0 : REMOUNTS} remounts`}</Text>
      {mode === 'text' ? (
        // A new key each tick mounts a new <Svg>, as a screen that unmounts and remounts it would.
        <Svg key={count} width={48} height={48} viewBox="0 0 24 24">
          <SvgText x={12} y={16} fill="black" fontSize={8.5} textAnchor="middle">
            3
          </SvgText>
        </Svg>
      ) : null}
      {mode === 'path' ? (
        <Svg key={count} width={48} height={48} viewBox="0 0 24 24">
          <Path d="M2.5 3.5H21.5M2.5 11H21.5M2.5 18.5H21.5" stroke="black" strokeWidth={1.8} />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  status: { fontSize: 18 },
});
