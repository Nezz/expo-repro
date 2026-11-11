import { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';

function App() {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let frames = 0;
    let lastSecond = Date.now();
    let raf = requestAnimationFrame(function onFrame() {
      frames += 1;
      raf = requestAnimationFrame(onFrame);
    });
    const report = setInterval(() => {
      const now = Date.now();
      const rate = Math.round((frames * 1000) / (now - lastSecond));
      const line = `${AppState.currentState}: ${rate} rAF callbacks/s`;
      setLines(previous => [line, ...previous].slice(0, 15));
      frames = 0;
      lastSecond = now;
    }, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(report);
    };
  }, []);

  return (
    <View style={styles.screen}>
      {lines.map((line, index) => (
        <Text key={lines.length - index} style={styles.line}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', paddingTop: 120, gap: 4 },
  line: { fontSize: 18, fontVariant: ['tabular-nums'] },
});

export default App;
