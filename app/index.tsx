import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>No Rive view on this screen.</Text>
      <Link href="/paused" style={styles.link}>
        Show a paused Rive view
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 24 },
  text: { color: "#FFF", fontSize: 16 },
  link: { color: "#8B80FF", fontSize: 18 },
});
