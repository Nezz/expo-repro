import { Drawer } from 'expo-router/drawer';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function DrawerContent() {
  return (
    <View style={styles.drawerContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.topSection}>
          <Text style={styles.title}>Drawer</Text>
        </View>
        <View style={styles.bottomSection}>
          <Text style={styles.subtitle}>User</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={() => <DrawerContent />}
      screenOptions={{ swipeEnabled: true }}
    >
      <Drawer.Screen name="index" options={{ headerShown: false }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  safeArea: {
    flex: 1,
  },
  topSection: {
    padding: 16,
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 15,
  },
});
