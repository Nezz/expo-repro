import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Link href="/details" style={styles.link}>
        Open the screen with a transparent header
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0f1a' },
  link: { color: '#4ade80', fontSize: 18 },
});
