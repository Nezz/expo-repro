import { View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useLocalSearchParams } from 'expo-router';

export default function HomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={{ backgroundColor: id, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText type="title">Welcome!</ThemedText>
    </View>
  );
}
