import { router } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function Linked() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text>A fullScreenModal screen</Text>
      <Button title="Back" onPress={() => router.back()} />
    </View>
  );
}
