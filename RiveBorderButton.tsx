import { forwardRef, useEffect, useState } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import {
  Fit,
  RiveView,
  useRive,
  useRiveBoolean,
  useRiveFile,
  useViewModelInstance,
} from "@rive-app/react-native";
import { LinearGradient } from "expo-linear-gradient";

interface RiveBorderInputProps extends TextInputProps {
  nextInputRef?: React.RefObject<TextInput | null>;
}

/**
 * Minimal repro of the login page's FormField + RiveGradientBorder.
 *
 * Issue: the Rive animation rendered with Fit.Layout around the input
 * is too big — it overflows well beyond the expected border area.
 */
export const RiveBorderInput = forwardRef<TextInput, RiveBorderInputProps>(
  function RiveBorderInput({ nextInputRef, ...textInputProps }, ref) {
  const [isFocused, setIsFocused] = useState(false);
  const { riveViewRef, setHybridRef } = useRive();
  const { riveFile } = useRiveFile(require("./assets/GradientBorder.riv"));
  const { instance: viewModelInstance } = useViewModelInstance(riveFile);
  const { setValue: setRiveFocused } = useRiveBoolean(
    "isFocused",
    viewModelInstance,
  );

  useEffect(() => {
    setRiveFocused(isFocused);
    riveViewRef?.playIfNeeded();
  }, [isFocused, setRiveFocused, riveViewRef]);

  return (
    <View style={styles.outerContainer}>
      <View style={styles.wrapper}>
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

        <LinearGradient
          colors={
            isFocused ? ["#00B78B", "#443ABC"] : ["#354190", "#4250BA"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.fieldInner}>
            <TextInput
              ref={ref}
              style={styles.input}
              placeholderTextColor="#6b7280"
              returnKeyType={nextInputRef ? "next" : "done"}
              onSubmitEditing={() => nextInputRef?.current?.focus()}
              {...textInputProps}
              onFocus={(e) => {
                setIsFocused(true);
                textInputProps.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                textInputProps.onBlur?.(e);
              }}
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 16,
  },
  wrapper: {
    borderRadius: 16,
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
  fieldInner: {
    backgroundColor: "rgba(3, 7, 18, 0.80)",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
  },
  input: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    padding: 0,
  },
});
