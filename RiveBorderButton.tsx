import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Fit, RiveView, useRive, useRiveFile } from '@rive-app/react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface RiveBorderButtonProps {
  label: string;
  isFocused: boolean;
  onPress: () => void;
}

/**
 * Minimal repro of FocusableGradientBorder from the main project.
 *
 * Uses the same imperative approach:
 *   - useRiveFile  → loads the .riv
 *   - useRive      → gives a ref to call setBooleanInputValue
 *
 * The problem: after migrating to the new Rive SDK (0.2.x),
 * toggling `isFocused` between two instances doesn't animate correctly.
 */
export function RiveBorderButton({ label, isFocused, onPress }: RiveBorderButtonProps) {
  const { riveFile } = useRiveFile(
    'https://dh8dcfhaxrjo9.cloudfront.net/Rive/Border.riv',
  );
  const { riveViewRef, setHybridRef } = useRive();

  useEffect(() => {
    riveViewRef?.setBooleanInputValue('isFocused', isFocused);
  }, [isFocused, riveViewRef]);

  return (
    <Pressable onPress={onPress}>
      <View style={styles.wrapper}>
        {/* Rive border animation layer */}
        {riveFile && (
          <RiveView
            file={riveFile}
            autoPlay
            fit={Fit.Layout}
            style={styles.riveAnimation}
            hybridRef={setHybridRef}
          />
        )}

        {/* Gradient border + inner content */}
        <LinearGradient
          colors={isFocused ? ['#00B78B', '#443ABC'] : ['#354190', '#4250BA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.inner}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.state}>
              {isFocused ? '● Focused' : '○ Not focused'}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: 'visible',
  },
  riveAnimation: {
    position: 'absolute',
    top: -25,
    left: -25,
    right: -28,
    bottom: -28,
  },
  gradient: {
    borderRadius: 16,
    padding: 1,
  },
  inner: {
    backgroundColor: '#141936',
    borderRadius: 15,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  state: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});
