import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Fit,
  RiveView,
  useRive,
  useRiveBoolean,
  useRiveFile,
  useViewModelInstance,
} from "@rive-app/react-native";
import { LinearGradient } from "expo-linear-gradient";

interface RiveBorderButtonProps {
  label: string;
  isFocused: boolean;
  onPress: () => void;
}

/**
 * Minimal repro of FocusableGradientBorder from the main project.
 *
 * Uses the same imperative approach:
 *   - useRiveFile  → loads the .riv
 *   - useRive      → gives a ref to call setBooleanInputValue
 *
 * The problem: after migrating to the new Rive SDK (0.2.x),
 * toggling `isFocused` between two instances doesn't animate correctly.
 */
export function RiveBorderButton({
  label,
  isFocused,
  onPress,
}: RiveBorderButtonProps) {
  const { riveViewRef, setHybridRef } = useRive();
  const { riveFile } = useRiveFile(
    require("./assets/GradientBorder.riv"),
  );
  const { instance: viewModelInstance } = useViewModelInstance(riveFile);
  const { setValue: setIsFocused } = useRiveBoolean(
    "isFocused",
    viewModelInstance,
  );

  useEffect(() => {
    setIsFocused?.(isFocused);
    riveViewRef?.playIfNeeded(); // This animation stops when focused is false, so we need to restart it
  }, [isFocused, setIsFocused, riveViewRef]);

  return (
    <Pressable onPress={onPress}>
      <View style={styles.wrapper}>
        {/* Rive border animation layer */}
        {riveFile && viewModelInstance && (
          <RiveView
            file={riveFile}
            autoPlay
            fit={Fit.Layout}
            style={styles.riveAnimation}
            dataBind={viewModelInstance}
            hybridRef={setHybridRef}
          />
        )}

        {/* Gradient border + inner content */}
        <LinearGradient
          colors={isFocused ? ["#00B78B", "#443ABC"] : ["#354190", "#4250BA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.inner}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.state}>
              {isFocused ? "● Focused" : "○ Not focused"}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    minWidth: 20,
    overflow: "visible",
  },
  riveAnimation: {
    position: "absolute",
    top: -25,
    left: -25,
    right: -28,
    bottom: -28,
  },
  gradient: {
    borderRadius: 16,
    padding: 1,
  },
  inner: {
    backgroundColor: "#141936",
    borderRadius: 15,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  state: {
    color: "#9CA3AF",
    fontSize: 12,
  },
});
