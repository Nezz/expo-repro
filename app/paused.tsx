import { Fit, RiveView, useRive, useRiveFile } from "@rive-app/react-native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Paused() {
  const { riveFile } = useRiveFile(require("../assets/rewards.riv"));
  const { riveViewRef, setHybridRef } = useRive();

  useEffect(() => {
    if (!riveViewRef) return;
    const timeout = setTimeout(() => riveViewRef.pause(), 1000);
    return () => clearTimeout(timeout);
  }, [riveViewRef]);

  return (
    <View style={styles.container}>
      {riveFile && (
        <RiveView
          hybridRef={setHybridRef}
          file={riveFile}
          autoPlay
          fit={Fit.Contain}
          style={styles.rive}
        />
      )}
      <Text style={styles.text}>
        This Rive view plays for a second, then pause() holds its frame.
        Nothing on screen changes after that.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 24 },
  rive: { width: 300, height: 300 },
  text: { color: "#FFF", fontSize: 16, textAlign: "center", paddingHorizontal: 24 },
});
