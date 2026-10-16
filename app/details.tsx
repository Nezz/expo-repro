import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Details() {
  const navigation = useNavigation();
  const [transitionEnded, setTransitionEnded] = useState(false);

  useEffect(
    () =>
      navigation.addListener('transitionEnd', (event) => {
        console.log('transitionEnd', event.data);
        if (!event.data.closing) setTransitionEnded(true);
      }),
    [navigation],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.text}>transitionEnd: {transitionEnded ? 'received' : 'waiting'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 20 },
});
