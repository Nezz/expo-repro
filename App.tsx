import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

// userInterfaceStyle is "dark" in app.json. Look at the navigation bar (three-button navigation) after a cold start
// and after the activity is recreated in the same process (Developer options > Don't keep activities, Home, reopen).
export default function App() {
  const scheme = useColorScheme();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>useColorScheme(): {scheme}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#808080',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#000', fontSize: 20 },
});
