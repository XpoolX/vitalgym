// app/_layout.tsx
import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#0E0E0E", // mismo color que usas en tus pantallas
        }}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0E0E0E" }, // color coherente en todo
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
