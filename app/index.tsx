import { router, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';

let mountedHomes = 0;

export default function Home() {
  const [instance] = useState(() => ++mountedHomes);
  const navigation = useNavigation();
  const routeNames = () => navigation.getState()?.routes.map((route) => route.name).join(', ');
  const [stack, setStack] = useState(routeNames);
  useEffect(() => navigation.addListener('state', () => setStack(routeNames())), [navigation]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Text>Home #{instance}</Text>
      <Text>Stack: {stack}</Text>
      <Button title="Push /private" onPress={() => router.push('/private')} />
    </View>
  );
}
