import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// Two boxes, 40 and 120 tall. Stacked, they sit in a column; side by side, in a row with flex: 1 each, so they
// should be equally wide. Open the app stacked, then tap "Side by side": the boxes come out 80 points apart in width,
// because each kept the flex basis Yoga computed for it in the column (its height). With "Use width: 50%" tapped
// first, the boxes get a definite width instead of flex: 1, and come out equal.
export default function App() {
	const [stacked, setStacked] = useState(true);
	const [useWidth, setUseWidth] = useState(false);
	const half = useWidth ? styles.halfWidth : styles.half;
	const [widths, setWidths] = useState<[number, number]>([0, 0]);
	return (
		<View style={styles.screen}>
			<Pressable
				accessibilityRole="button"
				onPress={() => {
					setWidths([0, 0]);
					setStacked((value) => !value);
				}}
				style={styles.button}
			>
				<Text>{stacked ? "Side by side" : "Stacked"}</Text>
			</Pressable>
			<Pressable accessibilityRole="button" onPress={() => setUseWidth(true)} style={styles.button}>
				<Text>{useWidth ? "Using width: 50%" : "Use width: 50%"}</Text>
			</Pressable>
			<View style={stacked ? styles.column : styles.row}>
				<View
					style={stacked ? undefined : half}
					onLayout={(event) => {
						const width = Math.round(event.nativeEvent.layout.width);
						setWidths((current) => [width, current[1]]);
					}}
				>
					<View style={[styles.box, { height: 40 }]} />
				</View>
				<View
					style={stacked ? undefined : half}
					onLayout={(event) => {
						const width = Math.round(event.nativeEvent.layout.width);
						setWidths((current) => [current[0], width]);
					}}
				>
					<View style={[styles.box, { height: 120 }]} />
				</View>
			</View>
			<Text>{describe(stacked, widths)}</Text>
		</View>
	);
}

function describe(stacked: boolean, [first, second]: [number, number]): string {
	if (stacked) {
		return "stacked";
	}
	if (first === 0 || second === 0) {
		return "measuring";
	}
	return first === second ? "widths match" : `widths differ: ${first} and ${second}`;
}

const styles = StyleSheet.create({
	screen: { flex: 1, paddingTop: 80, paddingHorizontal: 16, gap: 16 },
	button: { padding: 12, backgroundColor: "#cde", alignItems: "center" },
	column: { gap: 8 },
	row: { flexDirection: "row", gap: 8 },
	half: { flex: 1 },
	halfWidth: { width: "50%", flexShrink: 1 },
	box: { backgroundColor: "#fc9" },
});
