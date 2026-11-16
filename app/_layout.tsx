import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Protected guard={false}>
        <Stack.Screen name="private" options={{ title: 'Private' }} />
      </Stack.Protected>
    </Stack>
  );
}
