import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

// Long enough that the glass view is certainly laid out while the fade is still
// running. At 200ms case 2 only fails every few runs.
const FADE_DURATION = 1500;

// Where in the fade each rung of the ladder switches its effect on. The fade is
// linear, so opacity reaches `threshold` at `threshold * FADE_DURATION`.
const THRESHOLDS = [0, 0.01, 0.02, 0.03, 0.05, 0.1, 0.25];

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

        <Case label="3. Ancestor fades 0.05 → 1 — starting above zero">
          <FadeIn from={0.05}>{() => <GlassView style={styles.glass} />}</FadeIn>
        </Case>

        <Text style={styles.caseLabel}>4. Fades 0 → 1, effect switched on at</Text>
        <ThresholdLadder />

        <Pressable style={styles.button} onPress={() => setRunId((id) => id + 1)}>
          <Text style={styles.buttonLabel}>Run again</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Every rung runs the same 0 → 1 fade, and differs only in how far into that
// fade it switches the effect from 'none' to 'regular'.
function ThresholdLadder() {
  return (
    <View style={styles.ladderRow}>
      {THRESHOLDS.map((threshold) => (
        <View key={threshold} style={styles.rung}>
          <FadeIn switchAt={threshold}>
            {(on) => <GlassView style={styles.swatch} glassEffectStyle={on ? 'regular' : 'none'} />}
          </FadeIn>
          <Text style={styles.rungLabel}>{threshold}</Text>
        </View>
      ))}
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

/**
 * Fades opacity from `from` to 1 on mount, linearly, and reports `true` once the
 * fade has passed `switchAt`.
 */
function FadeIn({
  from = 0,
  switchAt = 1,
  children,
}: {
  from?: number;
  switchAt?: number;
  children: (on: boolean) => React.ReactNode;
}) {
  const [opacity] = useState(() => new Animated.Value(from));
  const [on, setOn] = useState(false);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_DURATION,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => setOn(true), FADE_DURATION * switchAt);
    return () => clearTimeout(timer);
  }, [opacity, switchAt]);

  return <Animated.View style={{ opacity }}>{children(on)}</Animated.View>;
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
  ladderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rung: {
    alignItems: 'center',
    gap: 4,
  },
  swatch: {
    width: 42,
    height: 42,
    borderRadius: 13,
  },
  rungLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
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
