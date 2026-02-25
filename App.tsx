import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Rive, { Fit, RiveRef } from 'rive-react-native';

export default function App() {
  const [isFocused, setIsFocused] = useState(false);
  const riveRef = useRef<RiveRef>(null);

  useEffect(() => {
    riveRef.current?.setInputState('State', 'isFocused', isFocused);
    if (!isFocused) {
      riveRef.current?.reset();
    }
  }, [isFocused]);

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={() => setIsFocused((prev) => !prev)}>
        <Rive
          url="https://dh8dcfhaxrjo9.cloudfront.net/Rive/Border.riv"
          autoplay
          fit={Fit.Layout}
          style={styles.riveAnimation}
          ref={riveRef}
        />
        <Text style={styles.buttonText}>{isFocused ? 'Focused' : 'Tap to Focus'}</Text>
      </Pressable>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 32,
  },
  button: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  riveAnimation: {
    position: 'absolute',
    top: -25,
    left: -25,
    right: -28,
    bottom: -28,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
