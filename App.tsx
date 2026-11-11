import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// A looping video with sound (a 440 Hz tone), playing from launch with the default audioMixingMode ("auto").
// Make Android take the audio focus for a while, then give it back, for example with an incoming call on an emulator:
//   adb emu gsm call 5551234   (the ringtone takes transient focus: the video pauses)
//   adb emu gsm cancel         (the focus comes back: the video stays paused)
export default function App() {
  const player = useVideoPlayer(require('./assets/tone.mp4'), (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.play();
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    console.log(`[repro] playing=${isPlaying}`);
  }, [isPlaying]);

  return (
    <View style={styles.screen}>
      <VideoView player={player} style={styles.video} nativeControls={false} />
      <Text testID="state" style={styles.state}>
        {isPlaying ? 'PLAYING' : 'PAUSED'}
      </Text>
      <Pressable testID="play" style={styles.button} onPress={() => player.play()}>
        <Text style={styles.buttonText}>PLAY</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', paddingTop: 100, alignItems: 'center', gap: 16 },
  video: { width: 320, height: 180 },
  state: { fontSize: 28, fontWeight: '700' },
  button: { backgroundColor: '#1b5fd6', paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
