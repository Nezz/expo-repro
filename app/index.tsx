import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';

export default function Index() {
  const [permStatus, setPermStatus] = useState<{
    status: string;
    expires: string;
    granted: boolean;
    canAskAgain: boolean;
  } | null>(null);

  const checkPermissions = async () => {
    const { status, expires, granted, canAskAgain } =
      await getRecordingPermissionsAsync();
    console.log(
      'microphone permission status',
      status,
      expires,
      granted,
      canAskAgain,
    );
    setPermStatus({ status, expires: String(expires), granted, canAskAgain });
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const requestPermission = async () => {
    await requestRecordingPermissionsAsync();
    await checkPermissions();
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>
        expo-audio: Android mic permission repro
      </Text>

      <View style={styles.permBox}>
        <Text style={styles.permLabel}>Microphone Permission</Text>
        {permStatus ? (
          <>
            <Text style={styles.permValue}>status: {permStatus.status}</Text>
            <Text style={styles.permValue}>expires: {permStatus.expires}</Text>
            <Text style={styles.permValue}>
              granted: {String(permStatus.granted)}
            </Text>
            <Text style={styles.permValue}>
              canAskAgain: {String(permStatus.canAskAgain)}
            </Text>
          </>
        ) : (
          <Text style={styles.permValue}>Loading…</Text>
        )}
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.permButton,
            pressed && styles.pressed,
          ]}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Request Permission</Text>
        </Pressable>
      </View>
    </View>
  );
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
  permBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  permLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  permValue: {
    color: '#9ca3af',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  buttons: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  permButton: {
    backgroundColor: '#7c3aed',
  },
  pressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
