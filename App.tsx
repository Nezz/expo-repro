import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

// Long enough that the glass view is certainly laid out while the fade is still
// running. At 200ms case 2 only fails every few runs.
const FADE_DURATION = 1500;

// The opacity each rung of the ladder starts its fade from. The effect is left
// on throughout, so the only variable is where the fade begins.
const FROM_VALUES = [0, 0.01, 0.02, 0.05, 0.1, 0.25, 0.5];

// Opacities to lay the view out at before jumping it to 1. A swatch at 1% is
// invisible either way, so the jump is what shows whether the effect survived
// being installed that transparent.
const MOUNT_VALUES = [0, 0.005, 0.01, 0.015, 0.02, 0.05, 0.1];

// How long each rung sits at its mount opacity before jumping to 1.
const REVEAL_DELAY = 2000;

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

        <Case label="2. Fades 0 → 1, useNativeDriver: true — no glass, ever (the bug)">
          <FadeIn>{() => <GlassView style={styles.glass} />}</FadeIn>
        </Case>

        <Case label="2b. Same fade, useNativeDriver: false">
          <FadeIn native={false}>{() => <GlassView style={styles.glass} />}</FadeIn>
        </Case>

        <Text style={styles.caseLabel}>3. Effect always on, fade starts from</Text>
        <FromLadder />

        <Text style={styles.caseLabel}>4. Laid out at this opacity, then jumped to 1</Text>
        <MountLadder />

        <Pressable style={styles.button} onPress={() => setRunId((id) => id + 1)}>
          <Text style={styles.buttonLabel}>Run again</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Every rung keeps its effect on the whole time and differs only in the opacity
// its fade starts from.
function FromLadder() {
  return (
    <View style={styles.ladderRow}>
      {FROM_VALUES.map((from) => (
        <View key={from} style={styles.rung}>
          <FadeIn from={from}>{() => <GlassView style={styles.swatch} />}</FadeIn>
          <Text style={styles.rungLabel}>{from}</Text>
        </View>
      ))}
    </View>
  );
}

// No animation anywhere: each rung is laid out at a fixed opacity and later
// jumped straight to 1, so what shows is whether its effect survived the mount.
function MountLadder() {
  return (
    <View style={styles.ladderRow}>
      {MOUNT_VALUES.map((from) => (
        <View key={from} style={styles.rung}>
          <MountThenReveal from={from}>
            <GlassView style={styles.swatch} />
          </MountThenReveal>
          <Text style={styles.rungLabel}>{from}</Text>
        </View>
      ))}
    </View>
  );
}

function MountThenReveal({ from, children }: { from: number; children: React.ReactNode }) {
  const [opacity, setOpacity] = useState(from);

  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), REVEAL_DELAY);
    return () => clearTimeout(timer);
  }, []);

  return <View style={{ opacity }}>{children}</View>;
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
  native = true,
  children,
}: {
  from?: number;
  switchAt?: number;
  native?: boolean;
  children: (on: boolean) => React.ReactNode;
}) {
  const [opacity] = useState(() => new Animated.Value(from));
  const [on, setOn] = useState(false);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_DURATION,
      easing: Easing.linear,
      useNativeDriver: native,
    }).start();

    const timer = setTimeout(() => setOn(true), FADE_DURATION * switchAt);
    return () => clearTimeout(timer);
  }, [opacity, switchAt, native]);

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
