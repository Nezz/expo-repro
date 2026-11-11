import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const LABEL = 'Instruments and tools';
const WIDE = 340;
const NARROW = 120;

// Both boxes hold the same one-line Text at fontSize 28 with adjustsFontSizeToFit. Press NARROW, then WIDEN.
// The control's Text is remounted on every change (its key), so it fits from scratch.
export default function App() {
  const [isNarrow, setIsNarrow] = useState(false);
  const width = isNarrow ? NARROW : WIDE;
  return (
    <View style={styles.screen}>
      <Text style={styles.caption}>Same Text, box {width} wide</Text>
      <View style={[styles.box, { width }]}>
        <Text testID="fitted" numberOfLines={1} adjustsFontSizeToFit style={styles.label}>
          {LABEL}
        </Text>
      </View>
      <Text style={styles.caption}>Control: remounted on each change, box {width} wide</Text>
      <View style={[styles.box, { width }]}>
        <Text key={width} testID="control" numberOfLines={1} adjustsFontSizeToFit style={styles.label}>
          {LABEL}
        </Text>
      </View>
      <Pressable testID="toggle" style={styles.button} onPress={() => setIsNarrow((narrow) => !narrow)}>
        <Text style={styles.buttonText}>{isNarrow ? 'WIDEN' : 'NARROW'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', paddingTop: 120, paddingHorizontal: 20, gap: 12 },
  caption: { fontSize: 14, color: '#555' },
  box: { height: 48, justifyContent: 'center', backgroundColor: '#e8eefc' },
  label: { fontSize: 28, color: '#000' },
  button: { marginTop: 24, alignSelf: 'flex-start', backgroundColor: '#1b5fd6', paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
