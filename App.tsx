import Slider from "@react-native-community/slider";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

// A stock Slider, 0 to 100, across the screen. Drag it with one finger, put a second finger down anywhere else on the
// screen, then lift the first finger: on Android the slider follows the second finger and onSlidingComplete reports
// where that one lifts.
export default function App() {
	const [start, setStart] = useState<number>();
	const [complete, setComplete] = useState<number>();
	return (
		<View style={styles.screen}>
			<Text>start: {start === undefined ? "-" : Math.round(start)}</Text>
			<Text>complete: {complete === undefined ? "-" : Math.round(complete)}</Text>
			<Slider
				style={styles.slider}
				minimumValue={0}
				maximumValue={100}
				value={50}
				onSlidingStart={setStart}
				onSlidingComplete={(value) => {
					console.log(`onSlidingComplete ${value}`);
					setComplete(value);
				}}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, justifyContent: "center", gap: 16, padding: 24 },
	slider: { height: 48 },
});
