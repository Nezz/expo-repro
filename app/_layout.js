import { Slot } from 'expo-router';

// An app's own native work at startup: each read runs on React Native's native-modules thread, queued ahead of
// expo-router's Linking.getInitialURL(). 0 is the control.
const STARTUP_READS = 20;

const blob = new Blob(['x'.repeat(5_000_000)]);
for (let i = 0; i < STARTUP_READS; i++) {
  new FileReader().readAsDataURL(blob);
}

export default Slot;
