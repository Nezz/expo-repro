import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const rows = Array.from({ length: 40 }, (_, i) => i);

export default function App() {
  const [introHeight, setIntroHeight] = useState(400);

  return (
    <View style={styles.container}>
      {/* Pressable, not Button: TouchableOpacity starts a native-driven
          opacity animation, which flushes native Animated and hides the bug. */}
      <Pressable
        style={styles.button}
        onPress={() => setIntroHeight(introHeight > 0 ? 0 : 400)}>
        <Text>{introHeight > 0 ? 'Collapse intro' : 'Expand intro'}</Text>
      </Pressable>
      <ScrollView stickyHeaderIndices={[1]}>
        <View style={[styles.intro, { height: introHeight }]}>
          <Text>Intro ({introHeight} pt)</Text>
        </View>
        <View style={styles.header}>
          <Text style={styles.headerText}>Sticky header</Text>
        </View>
        {rows.map(i => (
          <View key={i} style={styles.row}>
            <Text>Row {i}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: 'white' },
  button: { padding: 16, alignItems: 'center' },
  intro: { backgroundColor: '#ffd27f', justifyContent: 'center', alignItems: 'center' },
  header: { height: 60, backgroundColor: '#3b5bdb', justifyContent: 'center', alignItems: 'center' },
  headerText: { color: 'white', fontWeight: 'bold' },
  row: { height: 60, borderBottomWidth: 1, borderColor: '#ddd', justifyContent: 'center', paddingLeft: 16 },
});
