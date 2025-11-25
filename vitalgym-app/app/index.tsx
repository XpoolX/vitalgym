// app/index.tsx
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { getToken } from "../lib/auth";

export default function Index() {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const t = await getToken();
      setToken(t ?? null);
    })();
  }, []);

  if (token === undefined) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Nada de <Slot /> aquí: esto es una pantalla, no un layout.
  return token ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
