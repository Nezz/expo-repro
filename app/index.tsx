import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const modes = ['flatten', 'reorder', 'control', 'delayed', 'goBack'] as const;

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      {modes.map((mode) => (
        <Pressable key={mode} style={styles.button} onPress={() => router.push({ pathname: '/second', params: { mode } })}>
          <Text style={styles.label}>Open {mode}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  title: { fontSize: 28 },
  button: { padding: 16, backgroundColor: '#ddd' },
  label: { fontSize: 20 },
});
