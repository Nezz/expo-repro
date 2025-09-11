import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
    DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Link } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
      <View style={styles.content}>
        <Link href={'/'}>
            <Link.Trigger>
                <View>
                    <Text style={styles.button}>Index</Text>
                </View>
            </Link.Trigger>
            <Link.Preview />
            <Link.Menu>
            <Link.MenuAction title="Share" icon="square.and.arrow.up" onPress={() => {}} />
            <Link.MenuAction title="Delete" icon="trash" destructive onPress={() => {}} />
            </Link.Menu>
        </Link>

        <Link href={'/explore'}>
            <Link.Trigger>
                <View>
                    <Text style={styles.button}>Explore</Text>
                </View>
            </Link.Trigger>
            <Link.Preview />
        </Link>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    gap: 10,
    minWidth: 150,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
