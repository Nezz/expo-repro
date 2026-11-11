import { useState } from 'react';
import { Button, Modal, Text, View } from 'react-native';

export default function Index() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [taps, setTaps] = useState(0);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text>Taps: {taps}</Text>
      <Button title="Tap me" onPress={() => setTaps(taps + 1)} />
      <Button title="Open modal" onPress={() => setModalVisible(true)} />
      <Modal visible={isModalVisible} transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' }}>
          <View style={{ backgroundColor: 'white', padding: 32 }}>
            <Text>A transparent Modal. Now open repro://linked</Text>
            <Button title="Close modal" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
