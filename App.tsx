import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RiveBorderButton } from './RiveBorderButton';

export default function App() {
  const [selectedButton, setSelectedButton] = useState<'A' | 'B'>('A');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Rive Border Toggle Repro</Text>
      <Text style={styles.subtitle}>
        Press a button to toggle the border animation to it
      </Text>

      <View style={styles.buttonsRow}>
        <RiveBorderButton
          label="Button A"
          isFocused={selectedButton === 'A'}
          onPress={() => setSelectedButton('A')}
        />

        <RiveBorderButton
          label="Button B"
          isFocused={selectedButton === 'B'}
          onPress={() => setSelectedButton('B')}
        />
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Currently selected: <Text style={styles.statusHighlight}>{selectedButton}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1027',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statusContainer: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#1a1f3d',
    borderRadius: 12,
  },
  statusText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  statusHighlight: {
    color: '#00B78B',
    fontWeight: '700',
  },
});
