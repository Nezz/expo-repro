import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

// A full-screen button under a ScrollView with pointerEvents="box-none" that covers the right 60% of the screen. The
// button's label sits in that 60%. Tapping the label doesn't count on Android or iOS: the ScrollView takes the tap.
export default function App() {
	const [taps, setTaps] = useState(0);
	const { width, height } = useWindowDimensions();
	return (
		<View style={{ width, height }}>
			<Pressable accessibilityRole="button" onPress={() => setTaps((count) => count + 1)} style={[styles.under, { width, height }]}>
				<Text>Taps: {taps}</Text>
			</Pressable>
			<ScrollView pointerEvents="box-none" style={styles.over} contentContainerStyle={styles.content}>
				<Text style={styles.row}>Row</Text>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	under: { position: "absolute", top: 0, left: 0, alignItems: "center", justifyContent: "center", backgroundColor: "#cde" },
	over: { position: "absolute", top: 0, bottom: 0, right: 0, width: "60%" },
	content: { flexGrow: 1, justifyContent: "flex-end", pointerEvents: "box-none" },
	row: { padding: 16, backgroundColor: "#fc9" },
});
