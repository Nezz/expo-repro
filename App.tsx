/**
 * Reproducer: the link that relaunches an Android app whose activity or process Android ended.
 *
 * @format
 */

import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

function App() {
  const [initialUrl, setInitialUrl] = useState<string | null>();
  const [lastUrlEvent, setLastUrlEvent] = useState<string | null>(null);

  useEffect(() => {
    Linking.getInitialURL().then(setInitialUrl);
    const subscription = Linking.addEventListener('url', ({ url }) =>
      setLastUrlEvent(url),
    );
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.line} testID="initial-url">
        getInitialURL(): {initialUrl === undefined ? '…' : String(initialUrl)}
      </Text>
      <Text style={styles.line} testID="url-event">
        last url event: {String(lastUrlEvent)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  line: {
    fontSize: 18,
    marginVertical: 8,
  },
});

export default App;
