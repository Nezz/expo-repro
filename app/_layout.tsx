import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Linking } from 'react-native';

export default function Layout() {
  useEffect(() => {
    Linking.getInitialURL().then((url) => console.log(`REPRO root mounted, getInitialURL=${url}`));
    const subscription = Linking.addEventListener('url', ({ url }) => console.log(`REPRO url event ${url}`));
    return () => subscription.remove();
  }, []);
  return <Stack />;
}
