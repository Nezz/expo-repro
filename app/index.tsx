import { useVideoPlayer, VideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, Text, View } from 'react-native';

const source = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

export default function Index() {
  const texturePlayer = useVideoPlayer(source, start);
  const surfacePlayer = useVideoPlayer(source, start);
  return (
    <View style={styles.container}>
      <View style={styles.faded}>
        <Text style={styles.label}>textureView</Text>
        <VideoView player={texturePlayer} surfaceType="textureView" style={styles.video} />
        <Text style={styles.label}>surfaceView</Text>
        <VideoView player={surfacePlayer} style={styles.video} />
      </View>
    </View>
  );
}

function start(player: VideoPlayer) {
  player.muted = true;
  player.loop = true;
  player.play();
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'red' },
  faded: { opacity: 0.5, alignItems: 'center' },
  label: { color: 'white', fontSize: 18, marginVertical: 8 },
  video: { width: 300, height: 170 },
});
