import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { YoutubeView, useYouTubeEvent, useYouTubePlayer } from 'react-native-youtube-bridge';

export default function Index() {
  const player = useYouTubePlayer('M7lc1UVf-VE', { muted: true, playsinline: true });
  const [currentTime, setCurrentTime] = useState<number>();

  useYouTubeEvent(player, 'ready', () => {
    player.seekTo(60);
    setTimeout(async () => setCurrentTime(await player.getCurrentTime()), 2000);
  });

  return (
    <View style={styles.container}>
      <YoutubeView player={player} />
      <Text style={styles.text}>
        Called seekTo(60) on ready. Current time 2 s later: {currentTime?.toFixed(1) ?? '…'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: 24 },
  text: { fontSize: 18, textAlign: 'center' },
});
