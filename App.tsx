import MaskedView from '@react-native-masked-view/masked-view';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

// Remounts one full-screen view REMOUNTS times, 2 per second, then stops. Pick it with the link that starts the app:
//   adb shell am start -W -a android.intent.action.VIEW -d maskrepro://mask com.repro.maskedviewbitmap  (a <MaskedView>)
//   adb shell am start -W -a android.intent.action.VIEW -d maskrepro://view com.repro.maskedviewbitmap  (a <View>, control)
//   adb shell am start -W -a android.intent.action.VIEW -d maskrepro://idle com.repro.maskedviewbitmap  (nothing remounts)
// then read the native heap: adb shell dumpsys meminfo com.repro.maskedviewbitmap | grep 'Native Heap'
const REMOUNTS = 40;

type Mode = 'mask' | 'view' | 'idle';

export default function App() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    void Linking.getInitialURL().then((url) => {
      const host = url?.replace('maskrepro://', '').replace(/\/$/, '');
      setMode(host === 'mask' || host === 'view' ? host : 'idle');
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
    }, 500);
    return () => clearInterval(timer);
  }, [mode]);

  const content = (
    <View style={styles.content}>
      <Text style={styles.status}>{`${mode ?? '...'}: ${count} / ${mode === 'idle' ? 0 : REMOUNTS} remounts`}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {mode === 'mask' ? (
        // A new key each tick mounts a new <MaskedView>, as a screen that is opened and closed again would.
        <MaskedView key={count} style={styles.fill} maskElement={<View style={styles.mask} />}>
          {content}
        </MaskedView>
      ) : null}
      {mode === 'view' ? (
        <View key={count} style={styles.fill}>
          {content}
        </View>
      ) : null}
      {mode === 'idle' || mode === null ? content : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fill: { flex: 1 },
  mask: { flex: 1, margin: 24, borderRadius: 24, backgroundColor: 'black' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7fb2ff' },
  status: { fontSize: 18 },
});
