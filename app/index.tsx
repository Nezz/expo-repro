import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Background from "../Background";

export default function Home() {
  return (
    <Background>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Rive Border Repro</Text>
          <Text style={styles.subtitle}>
            The Rive animation around the input fields on the login page is too
            big.
          </Text>

          <Pressable
            style={styles.button}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.buttonText}>Go to Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 12,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#443ABC",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
