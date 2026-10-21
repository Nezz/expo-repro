import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import {
  KeyboardController,
  KeyboardEvents,
  KeyboardProvider,
  useKeyboardState,
} from 'react-native-keyboard-controller';

const EVENTS = ['keyboardWillShow', 'keyboardDidShow', 'keyboardWillHide', 'keyboardDidHide'] as const;

export default function Index() {
  return (
    <KeyboardProvider>
      <KeyboardStateScreen />
    </KeyboardProvider>
  );
}

function KeyboardStateScreen() {
  const { isVisible, height } = useKeyboardState();
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    const subscriptions = EVENTS.map((name) =>
      KeyboardEvents.addListener(name, (event) =>
        setEvents((previous) => [...previous.slice(-5), `${name} ${Math.round(event.height)}`]),
      ),
    );
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Tap to type" />
      <Text style={styles.text}>{`useKeyboardState: isVisible ${isVisible}, height ${Math.round(height)}`}</Text>
      <Text style={styles.text}>{`KeyboardController.isVisible(): ${KeyboardController.isVisible()}`}</Text>
      <Text style={styles.label}>Last events:</Text>
      {events.map((event, index) => (
        <Text key={index} style={styles.text}>
          {event}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 64, paddingHorizontal: 24, gap: 8, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, fontSize: 18 },
  text: { fontSize: 16 },
  label: { fontSize: 16, marginTop: 12, fontWeight: 'bold' },
});
