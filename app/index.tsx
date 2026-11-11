import { useEffect } from 'react';
import { Text } from 'react-native';

export default function Home() {
  useEffect(() => console.log('REPRO home mounted'), []);
  return <Text style={{ fontSize: 24, margin: 24 }}>route: home</Text>;
}
