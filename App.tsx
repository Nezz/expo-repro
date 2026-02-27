import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { RiveBorderButton } from './RiveBorderButton';

const BUTTONS = [
  { id: 'A', label: 'Button A' },
  { id: 'B', label: 'Button B' },
  { id: 'C', label: 'Button C' },
  { id: 'D', label: 'Button D' },
  { id: 'E', label: 'Button E' },
  { id: 'F', label: 'Button F' },
  { id: 'G', label: 'Button G' },
  { id: 'H', label: 'Button H' },
];

export default function App() {
  const [selectedButton, setSelectedButton] = useState('A');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Rive Border Toggle Repro</Text>
      <Text style={styles.subtitle}>
        Scroll horizontally & press a button to toggle the border animation
      </Text>

      <FlatList
        data={BUTTONS}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 24 }} />}
        renderItem={({ item }) => (
          <RiveBorderButton
            label={item.label}
            isFocused={selectedButton === item.id}
            onPress={() => setSelectedButton(item.id)}
          />
        )}
      />

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
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: 30,
    paddingVertical: 30,
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
