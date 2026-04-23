import { StatusBar } from 'expo-status-bar';
import { useEffect, useEffectEvent, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);

  const onTick = useEffectEvent(() => {
    console.log(count);
  });

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + 1);
      onTick();
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container}>
      <Text>Count: {count}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
