import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { LogBox, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventLog, logEvent } from '../components/EventLog';
import { LastChatProvider, useLastChat } from '../components/LastChat';

LogBox.ignoreAllLogs();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <LastChatProvider>
        <Drawer
          drawerContent={() => <DrawerContent />}
          screenOptions={{ headerShown: false }}
          screenListeners={{
            state: (e) => {
              const state = (e.data as { state: { history: { type: string }[]; routes: { key: string; name: string; params?: object }[]; index: number } }).state;
              const route = state.routes[state.index];
              if (e.target !== route.key) {
                return;
              }
              logEvent(`state: ${route.name} ${JSON.stringify(route.params ?? {})}, drawer ${state.history.some((h) => h.type === 'drawer') ? 'open' : 'closed'}`);
            },
          }}
        >
          <Drawer.Screen name="index" />
          <Drawer.Screen name="chat/[id]/index" />
        </Drawer>
        <EventLog />
      </LastChatProvider>
    </GestureHandlerRootView>
  );
}

function DrawerContent() {
  const insets = useSafeAreaInsets();
  const { lastChatId, setLastChatId } = useLastChat();

  return (
    <View style={[styles.drawer, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.drawerTitle}>Last chat: {lastChatId || '(none)'}</Text>
      {['1', '2', '3'].map((id) => (
        <Pressable key={id} style={styles.item} onPress={() => router.push(`/chat/${id}`)}>
          <Text style={styles.itemText}>Chat {id}</Text>
        </Pressable>
      ))}
      <Pressable
        testID="new-chat-button"
        style={[styles.item, styles.newChat]}
        onPress={() => {
          logEvent('New chat pressed');
          setLastChatId('');
          router.push('/');
        }}
      >
        <Text style={styles.newChatText}>New chat</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  drawer: { flex: 1, paddingHorizontal: 16, gap: 8, backgroundColor: '#f1f5f9' },
  drawerTitle: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  item: { padding: 14, borderRadius: 10, backgroundColor: '#ffffff' },
  itemText: { fontSize: 16 },
  newChat: { marginTop: 'auto', marginBottom: 48, backgroundColor: '#16a34a' },
  newChatText: { fontSize: 16, color: '#ffffff', fontWeight: '600', textAlign: 'center' },
});
