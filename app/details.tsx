import { StyleSheet, Text, View } from 'react-native';

export default function Details() {
  return (
    <View style={styles.container}>
      <View style={styles.stripe} />
      <Text style={styles.text}>
        The header above is `headerTransparent: true`. On iOS 26 the bar is invisible and this orange stripe runs to the
        top edge. On iOS 27 the bar area is drawn as a blurred glass rectangle.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1a' },
  stripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, backgroundColor: '#f97316' },
  text: { marginTop: 200, marginHorizontal: 24, color: '#ffffff', fontSize: 16, lineHeight: 24 },
});
