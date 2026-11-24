import { useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';

const ROWS = ['newest', 'middle', 'oldest'];

export default function App() {
  const [rows, setRows] = useState(ROWS);
  const [mvcp, setMvcp] = useState(true);
  const [offset, setOffset] = useState(0);
  const [renders, setRenders] = useState(0);
  return (
    <View style={styles.screen}>
      <Text testID="offset">Offset: {Math.round(offset)}</Text>
      <Button
        title="Remove newest"
        onPress={() => setRows(current => current.slice(1))}
      />
      <Button
        title={`Re-render (${renders})`}
        onPress={() => setRenders(count => count + 1)}
      />
      <Button
        title={`MVCP: ${mvcp ? 'on' : 'off'}`}
        onPress={() => setMvcp(on => !on)}
      />
      <FlatList
        inverted
        data={rows}
        keyExtractor={row => row}
        renderItem={({ item }) => <Text style={styles.row}>{item}</Text>}
        ListHeaderComponent={<View style={styles.header} />}
        maintainVisibleContentPosition={
          mvcp ? { minIndexForVisible: 1 } : undefined
        }
        onScroll={event => setOffset(event.nativeEvent.contentOffset.y)}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 64 },
  list: { flex: 1, backgroundColor: '#eef' },
  header: { height: 40, backgroundColor: '#fc9' },
  row: {
    height: 64,
    padding: 16,
    backgroundColor: '#cde',
    borderBottomWidth: 1,
  },
});
