import MaskedView from '@react-native-masked-view/masked-view';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, StyleSheet, View } from 'react-native';

// A full-screen MaskedView whose mask slides 250 px out and back every 0.6 s, on the native driver. The link that
// starts the app picks the case (measure.sh starts it and reads its frame stats):
//   maskrepro://nested  the moving view is the mask of a MaskedView that is itself the outer one's maskElement
//   maskrepro://single  the moving view is the outer one's maskElement
//   maskrepro://none    the control: the same moving view drawn over the same content, no MaskedView
type Mode = 'nested' | 'single' | 'none';

export default function App() {
  const [mode, setMode] = useState<Mode>();
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void Linking.getInitialURL().then((url) => {
      const host = url?.replace('maskrepro://', '').replace(/\/$/, '');
      setMode(host === 'single' || host === 'none' ? host : 'nested');
    });
  }, []);

  useEffect(() => {
    if (mode === undefined) {
      return;
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: -250, duration: 300, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 300, easing: Easing.linear, useNativeDriver: true }),
      ]),
    ).start();
  }, [mode, x]);

  const moving = <Animated.View style={[styles.mask, { transform: [{ translateX: x }] }]} />;

  if (mode === undefined) {
    return null;
  }
  if (mode === 'none') {
    return <View style={styles.content}>{moving}</View>;
  }
  return (
    <MaskedView
      style={styles.flex}
      maskElement={
        mode === 'nested' ? (
          <MaskedView style={styles.flex} maskElement={moving}>
            <View style={styles.mask} />
          </MaskedView>
        ) : (
          moving
        )
      }
    >
      <View style={styles.content} />
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  mask: { flex: 1, backgroundColor: 'black' },
  content: { flex: 1, backgroundColor: '#3a6ea5' },
});
