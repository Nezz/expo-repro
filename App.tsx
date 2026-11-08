import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

// Tap "request", then press Back on the system dialog without answering it. Tap "get", then "request" again.
export default function App() {
  const [lines, setLines] = useState<string[]>([]);
  const log = (label: string, { status, canAskAgain }: { status: string; canAskAgain: boolean }) =>
    setLines((previous) => [...previous, `${label}: status=${status} canAskAgain=${canAskAgain}`]);

  return (
    <View style={styles.container}>
      <Button title="request" onPress={async () => log('request', await requestRecordingPermissionsAsync())} />
      <Button title="get" onPress={async () => log('get', await getRecordingPermissionsAsync())} />
      {lines.map((line, index) => (
        <Text key={index} testID={`line-${index}`} style={styles.text}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  text: { fontSize: 18 },
});
