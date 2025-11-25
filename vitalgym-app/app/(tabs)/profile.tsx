// app/(tabs)/profile.tsx
import { View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { clearToken } from "../../lib/auth";

export default function Profile() {
  const router = useRouter();

  async function logout() {
    await clearToken();
    Alert.alert("Sesión cerrada");
    router.replace("/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0E0E0E", padding: 24 }}>
      <Text style={{ color: "white", fontSize: 22, fontWeight: "800", marginBottom: 12 }}>
        Mi perfil
      </Text>
      {/* Aquí podrías mostrar nombre/foto/email del usuario, etc. */}

      <Pressable
        onPress={logout}
        style={{
          backgroundColor: "#C20F0F",
          padding: 14,
          borderRadius: 14,
          alignItems: "center",
          marginTop: 16,
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

