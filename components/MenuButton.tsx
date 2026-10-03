import { DrawerNavigationProp } from 'expo-router/drawer';
import { useNavigation } from 'expo-router/react-navigation';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function MenuButton() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  return (
    <Pressable
      testID="menu-button"
      style={styles.button}
      onPress={() => {
        navigation.openDrawer();
      }}
    >
      <Text style={styles.text}>☰ Menu</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#0f172a' },
  text: { color: '#ffffff', fontSize: 16 },
});
