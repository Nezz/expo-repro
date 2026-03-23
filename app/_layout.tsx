import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { setAudioModeAsync } from 'expo-audio';

export default function Layout() {
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
      interruptionMode: 'mixWithOthers',
      allowsBackgroundRecording: false,
      // BUG: There is no `defaultToSpeaker` option available in expo-audio's
      // setAudioModeAsync. Without it, iOS routes playback through the earpiece
      // when allowsRecording is true, causing significantly lower volume.
    });
  }, []);

  return <Slot />;
}
