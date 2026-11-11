import { setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [steps, setSteps] = useState<string[]>([]);

  useEffect(() => {
    const log = (step: string) => {
      console.log(`[repro] ${step}`);
      setSteps((done) => [...done, step]);
    };
    (async () => {
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' });
      await setIsAudioActiveAsync(true);
      log('1. expo-audio set Playback (doNotMix) and activated the session');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      // Only the import: no VolumeManager method is called.
      require('react-native-volume-manager');
      log('2. imported react-native-volume-manager');
    })();
  }, []);

  return (
    <View style={styles.container}>
      {steps.map((step) => (
        <Text key={step}>{step}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
});
