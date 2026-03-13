import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { RiveBorderButton } from './RiveBorderButton';

export default function App() {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <RiveBorderButton
        label="Toggle Me"
        isFocused={isFocused}
        onPress={() => setIsFocused((prev) => !prev)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1027',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
