import Animated, { useAnimatedStyle } from 'react-native-reanimated';

export default function App() {
  const style = useAnimatedStyle(() => ({ opacity: 1 }));

  return <Animated.View style={[{ flex: 1, backgroundColor: 'teal' }, style]} />;
}
