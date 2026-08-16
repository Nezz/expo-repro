import { GlassView } from 'expo-glass-effect';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Reanimated, { FadeIn } from 'react-native-reanimated';
import { Screen, ScreenContainer } from 'react-native-screens';

const FADE_DURATION = 1500;
// The failure is stochastic, so each grid runs the same fade many times over.
// One screenshot is then one sample per tile rather than one for the whole app.
const TRIALS = 12;

export default function App() {
  const [runId, setRunId] = useState(0);
  const [tab, setTab] = useState(0);

  return (
    <View style={styles.screen}>
      {/* Two screens, so leaving and returning detaches the glass from the
          window and puts it back — the path that regressed in expo#43732. */}
      <ScreenContainer style={styles.container}>
        <Screen activityState={tab === 0 ? 2 : 0} style={StyleSheet.absoluteFill}>
          <View style={styles.content} key={runId}>
            <Text style={styles.title}>Fade 0 → 1 · {TRIALS} tiles each</Text>

            <Section label="control, no animation">
              <GlassView style={styles.control} />
            </Section>

            <Section label="react-native Animated">
              <View style={styles.grid}>
                {Array.from({ length: TRIALS }, (_, i) => (
                  <AnimatedFadeIn key={i}>
                    <GlassView style={styles.tile} />
                  </AnimatedFadeIn>
                ))}
              </View>
            </Section>

            <Section label="react-native-reanimated">
              <View style={styles.grid}>
                {Array.from({ length: TRIALS }, (_, i) => (
                  <Reanimated.View key={i} entering={FadeIn.duration(FADE_DURATION)}>
                    <GlassView style={styles.tile} />
                  </Reanimated.View>
                ))}
              </View>
            </Section>

            <Pressable style={styles.button} onPress={() => setRunId((id) => id + 1)}>
              <Text style={styles.buttonLabel}>Run again ({runId})</Text>
            </Pressable>
          </View>
        </Screen>

        <Screen activityState={tab === 1 ? 2 : 0} style={StyleSheet.absoluteFill}>
          <View style={styles.content}>
            <Text style={styles.title}>Second screen</Text>
            <Text style={styles.label}>Go back to check the glass survived the trip.</Text>
          </View>
        </Screen>
      </ScreenContainer>

      <Pressable style={styles.tabButton} onPress={() => setTab((current) => (current === 0 ? 1 : 0))}>
        <Text style={styles.buttonLabel}>{tab === 0 ? 'Leave screen' : 'Come back'}</Text>
      </Pressable>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function AnimatedFadeIn({ children }: { children: React.ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_DURATION,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#4db8ff',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 70,
    gap: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  section: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  control: {
    height: 36,
    borderRadius: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#000',
  },
  tabButton: {
    position: 'absolute',
    right: 20,
    bottom: 40,
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
