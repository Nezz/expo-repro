import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

// Long enough that the glass view is certainly laid out while the fade is still
// running. At 200ms case 2 only fails every few runs.
const FADE_DURATION = 1500;

export default function App() {
  const [runId, setRunId] = useState(0);

  return (
    <View style={styles.screen}>
      <View style={styles.content} key={runId}>
        <Text style={styles.title}>expo-glass-effect + ancestor opacity</Text>
        <Text style={styles.subtitle}>
          {isLiquidGlassAvailable() ? 'Liquid glass available' : 'Liquid glass NOT available on this device'}
        </Text>

        <Case label="1. No opacity animation — glass renders">
          <GlassView style={styles.glass} />
        </Case>

        <Case label="2. Ancestor fades 0 → 1 — no glass, ever (the bug)">
          <FadeIn>{() => <GlassView style={styles.glass} />}</FadeIn>
        </Case>

        <Case label="3. Same fade, effect held at 'none' until it ends — glass renders">
          <FadeIn>
            {(faded) => <GlassView style={styles.glass} glassEffectStyle={faded ? 'regular' : 'none'} />}
          </FadeIn>
        </Case>

        <Pressable style={styles.button} onPress={() => setRunId((id) => id + 1)}>
          <Text style={styles.buttonLabel}>Run again</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Case({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.case}>
      <Text style={styles.caseLabel}>{label}</Text>
      {children}
    </View>
  );
}

// Animates opacity from 0 to 1 on mount, the way any entrance animation does,
// and reports when it has finished. Reanimated's FadeIn behaves identically;
// react-native's Animated is used here to keep the repro dependency-free.
function FadeIn({ children }: { children: (faded: boolean) => React.ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_DURATION,
      useNativeDriver: true,
    }).start(() => setFaded(true));
  }, [opacity]);

  return <Animated.View style={{ opacity }}>{children(faded)}</Animated.View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#4db8ff',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 70,
    gap: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 13,
    color: '#000',
  },
  case: {
    gap: 6,
  },
  caseLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  glass: {
    height: 56,
    borderRadius: 28,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#000',
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
});
