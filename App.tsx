import { useState } from "react";
import { Button, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const DURATION_MS = 1000;

export default function App() {
	const width = useSharedValue(20);
	const [result, setResult] = useState("Tap Animate");
	const style = useAnimatedStyle(() => ({ width: width.value }));

	function animate() {
		const start = Date.now();
		const done = () => {
			const line = `withTiming(${DURATION_MS} ms) finished after ${Date.now() - start} ms`;
			console.log(line);
			setResult(line);
		};
		width.value = 20;
		width.value = withTiming(300, { duration: DURATION_MS }, (finished) => {
			if (finished) {
				scheduleOnRN(done);
			}
		});
	}

	return (
		<View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 24 }}>
			<Animated.View style={[{ height: 40, backgroundColor: "tomato" }, style]} />
			<Button title="Animate" onPress={animate} />
			<Text testID="result">{result}</Text>
		</View>
	);
}
