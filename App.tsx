import { useEffect, useRef } from 'react';
import { Alert, AppState, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlowBorder } from './GlowBorder';

const HEARTBEAT_INTERVAL_MS = 200;
const BLOCK_THRESHOLD_MS = 500;

const GRADIENT_PRESETS = [
  ['#00C87A', '#00B78B', '#00000000', '#443ABC', '#4250BA', '#00000000'],
  ['#FF6B6B', '#FF8E53', '#00000000', '#C850C0', '#4158D0', '#00000000'],
  ['#43E97B', '#38F9D7', '#00000000', '#FA709A', '#FEE140', '#00000000'],
  ['#0093E9', '#80D0C7', '#00000000', '#FDDB92', '#D1FDFF', '#00000000'],
  ['#F7971E', '#FFD200', '#00000000', '#FC354C', '#0ABDE3', '#00000000'],
];

export default function App() {
  const lastTickRef = useRef(Date.now());

  useEffect(() => {
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      console.log('[REPRO] AppState changed to:', nextState, 'at', Date.now());
    });

    const heartbeat = setInterval(() => {
      const now = Date.now();
      const gap = now - lastTickRef.current;
      lastTickRef.current = now;
      if (gap > BLOCK_THRESHOLD_MS) {
        console.log(`[REPRO] HEARTBEAT GAP: ${gap}ms — JS thread was blocked`);
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      appStateSub.remove();
      clearInterval(heartbeat);
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Skia Shader Stress Repro</Text>
      <Text style={styles.subtitle}>Background the app, then return. Check Metro logs for HEARTBEAT GAP.</Text>

      {GRADIENT_PRESETS.map((colors, i) => (
        <GlowBorder key={i} colors={colors} borderRadius={16}>
          <View style={styles.card}>
            <Text style={styles.cardText}>Shader #{i + 1}</Text>
          </View>
        </GlowBorder>
      ))}

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          console.log('[REPRO] Button pressed at', Date.now());
          Alert.alert('Hello there!');
        }}
      >
        <Text style={styles.buttonText}>Tap Me</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>If the alert is delayed after resuming, the JS thread was blocked.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 24,
    backgroundColor: '#0f0f0f',
    gap: 24,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  cardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
