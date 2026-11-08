import { Text, View } from 'react-native';
import { widths } from '../widths';

const LONG = 'This screen holds one long paragraph. '.repeat(40);

export default function Long() {
  return (
    <View
      style={{ flex: 1, backgroundColor: 'white' }}
      onLayout={(e) => {
        widths.push(e.nativeEvent.layout.width);
        console.log(`long screen ${e.nativeEvent.layout.width} pt`);
      }}
    >
      <Text style={{ fontSize: 17, padding: 16 }}>{LONG}</Text>
    </View>
  );
}
