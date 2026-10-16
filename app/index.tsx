import { StatusBar, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Text style={styles.text}>Without KeyboardProvider</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  text: { color: '#fff' },
});
