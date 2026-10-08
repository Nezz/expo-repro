import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { KeyLog } from '../components/KeyLog';

export default function Modal() {
  return (
    <View style={styles.container}>
      <KeyLog screen="modal" />
      <Link href="/" dismissTo style={styles.link}>
        Close
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1b4b' },
  link: { color: '#4ade80', fontSize: 18 },
});
