import { Redirect } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logEvent } from '../components/EventLog';
import { useLastChat } from '../components/LastChat';
import MenuButton from '../components/MenuButton';

export default function NewChatScreen() {
  const { lastChatId } = useLastChat();

  logEvent(`index render, lastChatId=${JSON.stringify(lastChatId)}`);
  if (lastChatId) {
    return <Redirect href={`/chat/${lastChatId}`} />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <MenuButton />
      <View style={styles.body}>
        <Text style={styles.title}>New chat</Text>
        <Text>Open the menu, pick a chat, then open the menu again and tap New chat.</Text>
      </View>
      <TextInput testID="chat-input" autoFocus placeholder="Message" style={styles.input} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#ffffff' },
  body: { flex: 1, gap: 8, paddingTop: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, fontSize: 16 },
});
