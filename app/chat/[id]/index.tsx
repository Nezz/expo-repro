import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logEvent } from '../../../components/EventLog';
import { useLastChat } from '../../../components/LastChat';
import MenuButton from '../../../components/MenuButton';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { setLastChatId } = useLastChat();

  useFocusEffect(
    useCallback(() => {
      logEvent(`chat ${id} focus`);
      setLastChatId(id);
    }, [id, setLastChatId]),
  );

  return (
    <SafeAreaView style={styles.screen}>
      <MenuButton />
      <View style={styles.body}>
        <Text style={styles.title}>Chat {id}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#fef9c3' },
  body: { flex: 1, paddingTop: 24 },
  title: { fontSize: 28, fontWeight: '700' },
});
