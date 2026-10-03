import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerScreenProps } from '@react-navigation/drawer';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type DrawerParamList = { NewChat: undefined };

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Drawer.Navigator drawerContent={(props) => <DrawerContent {...props} />} screenOptions={{ headerShown: false }}>
          <Drawer.Screen name="NewChat" component={NewChatScreen} />
        </Drawer.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function NewChatScreen({ navigation }: DrawerScreenProps<DrawerParamList, 'NewChat'>) {
  return (
    <SafeAreaView style={styles.screen}>
      <Pressable style={styles.menu} onPress={() => navigation.openDrawer()}>
        <Text style={styles.menuText}>☰ Menu</Text>
      </Pressable>
      <Text style={styles.title}>New chat</Text>
      <View style={styles.flex} />
      <TextInput autoFocus placeholder="Message" style={styles.input} />
    </SafeAreaView>
  );
}

function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.drawer, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.item}>Chat 1</Text>
      <Text style={styles.item}>Chat 2</Text>
      <View style={styles.flex} />
      <Pressable style={styles.newChat} onPress={() => navigation.navigate('NewChat')}>
        <Text style={styles.newChatText}>New chat</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, padding: 16, backgroundColor: '#ffffff' },
  menu: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#0f172a' },
  menuText: { color: '#ffffff', fontSize: 16 },
  title: { fontSize: 28, fontWeight: '700', marginTop: 24 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, fontSize: 16 },
  drawer: { flex: 1, paddingHorizontal: 16, gap: 8, backgroundColor: '#f1f5f9' },
  item: { padding: 14, borderRadius: 10, backgroundColor: '#ffffff', fontSize: 16, overflow: 'hidden' },
  newChat: { padding: 14, borderRadius: 10, backgroundColor: '#16a34a' },
  newChatText: { fontSize: 16, color: '#ffffff', fontWeight: '600', textAlign: 'center' },
});
