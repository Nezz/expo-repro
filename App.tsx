import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { VolumeManager } from 'react-native-volume-manager';

const READ_AFTER_MS = [0, 100, 500, 1000, 3000];

export default function App() {
  const [reads, setReads] = useState<string[]>([]);

  useEffect(() => {
    for (const ms of READ_AFTER_MS) {
      setTimeout(async () => {
        const { volume } = await VolumeManager.getVolume();
        const line = `getVolume() at ${ms} ms: ${volume}`;
        // console.error, as a Release build logs nothing below error level.
        console.error(`[repro] ${line}`);
        setReads((done) => [...done, line]);
      }, ms);
    }
  }, []);

  return (
    <View style={styles.container}>
      {reads.map((read) => (
        <Text key={read}>{read}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
});
