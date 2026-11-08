import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Mode = 'flatten' | 'reorder' | 'control' | 'delayed' | 'goBack';

export default function Second() {
  const { mode } = useLocalSearchParams<{ mode: Mode }>();
  const navigation = useNavigation();
  const [closing, setClosing] = useState(false);
  // Logs which commit carries the move and which one removes the screen (logcat, tag ReactNativeJS).
  useLayoutEffect(() => {
    if (closing) {
      console.log('repro: the move is committed');
      return () => console.log('repro: the screen is removed');
    }
  }, [closing]);
  const close = () => {
    // The state update moves a view inside this screen.
    setClosing(true);
    if (mode === 'goBack') {
      // A synchronous dispatch, without the routing queue.
      navigation.goBack();
    } else if (mode === 'delayed') {
      // The pop 100 ms later: the move is mounted by then.
      setTimeout(() => router.dismissTo('/'), 100);
    } else {
      // expo-router's routing queue: the pop is dispatched from a passive effect, one commit after the move.
      router.dismissTo('/');
    }
  };
  return (
    <View style={styles.container}>
      {mode === 'reorder' ? (
        // A keyed reorder: the two boxes swap places.
        (closing ? ['b', 'a'] : ['a', 'b']).map((key) => (
          <View key={key} style={[styles.box, key === 'b' && styles.boxB]} />
        ))
      ) : (
        // pointerEvents "none" gives the wrapper a native view. "box-none" lets Fabric flatten it, which moves the box up
        // to the nearest ancestor with a native view. collapsable={false} (control) keeps the wrapper, so nothing moves.
        <View
          style={styles.wrapper}
          pointerEvents={closing ? 'box-none' : 'none'}
          collapsable={mode === 'control' ? false : undefined}
        >
          <View style={styles.box} />
        </View>
      )}
      <Pressable style={styles.button} onPress={close}>
        <Text style={styles.label}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  wrapper: { position: 'absolute', top: 40, left: 40 },
  box: { width: 80, height: 80, backgroundColor: 'tomato' },
  boxB: { backgroundColor: 'steelblue' },
  button: { padding: 16, backgroundColor: '#ddd' },
  label: { fontSize: 20 },
});
