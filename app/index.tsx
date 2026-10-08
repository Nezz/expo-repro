import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getAudioSessionCategory } from '@/modules/audio-session/src';

const VIDEO =
  'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8';

export default function Index() {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(recorder, 100);
  const [category, setCategory] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [meterChangedAt, setMeterChangedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCategory(getAudioSessionCategory());
      setNow(Date.now());
    }, 250);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMeterChangedAt(Date.now());
  }, [recorderState.metering]);

  const startRecording = async () => {
    await requestRecordingPermissionsAsync();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const metering = recorderState.metering ?? -160;

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>
        expo-video: muted player silences expo-audio recording
      </Text>

      <View style={styles.box}>
        <Text style={styles.label}>AVAudioSession</Text>
        <Text style={styles.value}>{category}</Text>
        <Text style={styles.label}>Microphone</Text>
        <Text style={styles.value}>
          {recorderState.isRecording ? 'recording' : 'not recording'} ·{' '}
          {(recorderState.durationMillis / 1000).toFixed(1)} s
        </Text>
        <Text style={styles.value}>
          {metering.toFixed(1)} dB, changed{' '}
          {(Math.max(0, now - meterChangedAt) / 1000).toFixed(1)} s ago
        </Text>
        <View style={styles.meterTrack}>
          <View
            style={[
              styles.meterFill,
              { width: `${Math.max(0, (metering + 80) / 80) * 100}%` },
            ]}
          />
        </View>
      </View>

      <Pressable style={styles.button} onPress={startRecording}>
        <Text style={styles.buttonText}>1. Start recording</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => setShowVideo(true)}>
        <Text style={styles.buttonText}>2. Play a muted video</Text>
      </Pressable>

      {showVideo && <MutedVideo />}
    </View>
  );
}

function MutedVideo() {
  const player = useVideoPlayer(VIDEO, (player) => {
    player.muted = true;
    player.loop = true;
    player.play();
  });

  return <VideoView player={player} style={styles.video} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: 80,
    paddingHorizontal: 20,
    gap: 20,
  },
  heading: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  box: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  value: {
    color: '#9ca3af',
    fontSize: 14,
    fontFamily: 'Menlo',
  },
  meterTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginTop: 8,
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#7c3aed',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
});
