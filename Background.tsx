import {
  Fit,
  RiveView,
  useRiveFile,
  useViewModelInstance,
} from "@rive-app/react-native";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

interface BackgroundProps {
  children: ReactNode;
}

export default function Background({ children }: BackgroundProps) {
  const { riveFile } = useRiveFile(require("./assets/Background.riv"));
  const { instance: viewModelInstance } = useViewModelInstance(riveFile);

  return (
    <View style={styles.container}>
      {riveFile && viewModelInstance && (
        <RiveView
          file={riveFile}
          autoPlay
          fit={Fit.Cover}
          style={StyleSheet.absoluteFill}
          dataBind={viewModelInstance}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c1027",
  },
});
