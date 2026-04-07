import { useRef } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Background from "../Background";
import { RiveBorderInput } from "../RiveBorderButton";

export default function Login() {
  const passwordRef = useRef<TextInput>(null);

  return (
    <Background>
      <SafeAreaView style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in with your account to continue
          </Text>

          <View style={styles.fields}>
            <RiveBorderInput
              placeholder="Email or username"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              nextInputRef={passwordRef}
            />

            <RiveBorderInput
              ref={passwordRef}
              placeholder="Password"
              secureTextEntry
              returnKeyType="done"
            />
          </View>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  form: {
    alignItems: "center",
  },
  title: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "600",
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  fields: {
    width: "100%",
    maxWidth: 400,
  },
});
