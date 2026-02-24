import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PostHogProvider, PostHogSurveyProvider } from "posthog-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <PostHogProvider
        apiKey="bring_your_own_api_key"
        options={{
          host: "https://eu.i.posthog.com",
          enableSessionReplay: true,
          sessionReplayConfig: {
            maskAllImages: false,
            maskAllTextInputs: false,
          },
          captureAppLifecycleEvents: true,
          errorTracking: { autocapture: true },
        }}
        autocapture
      >
        <PostHogSurveyProvider>
          <Stack>
            <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="light" />
        </PostHogSurveyProvider>
      </PostHogProvider>
    </GestureHandlerRootView>
  );
}
