import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { widths } from '../widths';

export default function Index() {
  const { width: windowWidth } = useWindowDimensions();
  const [shown, setShown] = useState('');
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'white' }}>
      {/* The row case: the trigger sits in a row, as in a list row with a trailing button. */}
      <View style={{ flexDirection: 'row', paddingVertical: 24 }}>
        <Link href="/long">
          <Link.Trigger>
            <Text style={{ fontSize: 20 }}>Long-press me (row)</Text>
          </Link.Trigger>
          <Link.Preview />
        </Link>
      </View>
      {/* The control: the same Link in a column. */}
      <View style={{ flexDirection: 'column', paddingVertical: 24 }}>
        <Link href="/long">
          <Link.Trigger>
            <Text style={{ fontSize: 20 }}>Long-press me (column)</Text>
          </Link.Trigger>
          <Link.Preview />
        </Link>
      </View>
      <Pressable onPress={() => setShown(widths.map((w) => Math.round(w)).join(' '))}>
        <Text style={{ fontSize: 20, padding: 24 }}>Show widths</Text>
      </Pressable>
      <Text testID="widths" style={{ fontSize: 20, paddingHorizontal: 24 }}>
        {`window ${windowWidth}, preview widths: ${shown}`}
      </Text>
    </View>
  );
}
