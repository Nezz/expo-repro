import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerTitle: 'Root screen' }} />
      <Stack.Screen name="modal" options={{ presentation: 'fullScreenModal', headerShown: false }} />
    </Stack>
  );
}
