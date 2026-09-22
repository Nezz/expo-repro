import { ScrollView, StyleSheet, Text, View } from 'react-native';

const COLUMNS = 24;
const ROWS = 10;

export default function Details() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.checker}>
        {Array.from({ length: ROWS * COLUMNS }, (_, i) => (
          <View
            key={i}
            style={[styles.cell, { backgroundColor: (i + Math.floor(i / COLUMNS)) % 2 === 0 ? '#f97316' : '#1d4ed8' }]}
          />
        ))}
      </View>
      <Text style={styles.text}>
        The header above is `headerTransparent: true` and this screen is a ScrollView. Expected: the checker pattern
        reaches the top edge with sharp cells. Actual on iOS 27: the bar area is drawn as a blurred glass rectangle.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1a' },
  content: { minHeight: 1400 },
  checker: { height: 200, flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / COLUMNS}%`, height: 20 },
  text: { marginTop: 40, marginHorizontal: 24, color: '#ffffff', fontSize: 16, lineHeight: 24 },
});
