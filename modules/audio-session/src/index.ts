import { requireNativeModule } from 'expo-modules-core';

const AudioSession = requireNativeModule<{ getCategory(): string }>('AudioSession');

export function getAudioSessionCategory(): string {
  return AudioSession.getCategory();
}
