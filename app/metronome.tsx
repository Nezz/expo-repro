import { useEffect } from 'react';
import { Text } from 'react-native';

export default function Metronome() {
  useEffect(() => console.log('REPRO metronome mounted'), []);
  return <Text style={{ fontSize: 24, margin: 24 }}>route: metronome</Text>;
}
