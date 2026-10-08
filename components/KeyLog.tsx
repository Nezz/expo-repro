import { useKeyEvent } from 'expo-key-event';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

export function KeyLog({ screen }: { screen: string }) {
  const { keyEvent } = useKeyEvent({ preventReload: true });

  useEffect(() => {
    if (keyEvent) console.log(`[${screen}] key: ${keyEvent.key}`);
  }, [keyEvent, screen]);

  return <Text style={styles.text}>Last key on {screen}: {keyEvent?.key ?? '(none)'}</Text>;
}

const styles = StyleSheet.create({
  text: { color: '#ffffff', fontSize: 20, marginBottom: 24 },
});
