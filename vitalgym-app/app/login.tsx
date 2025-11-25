// app/login.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../lib/api";
import { saveToken, saveUser } from "../lib/auth";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", { email, password });

      if (!data?.token) throw new Error("Respuesta inesperada del servidor");
      await saveToken(data.token);
      await saveUser(data.user);
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message || e.message || "Login fallido"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0E0E0E",
        padding: 24,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          backgroundColor: "#0E0E0E",
          alignItems: "center", // 👈 centra horizontalmente todos los hijos
        }}
      >
      <Image
        source={require("../assets/logo.png")}
        style={{
          width: 140,
          height: 140,
          resizeMode: "contain",
          marginBottom: 32, // 👈 separa el logo del resto
        }}
      />
      {loading && (
        <ActivityIndicator
          style={{ marginBottom: 32 }}
          size="large"
          color="#C20F0F"
        />
      )}
      </View>
      <TextInput
        placeholder="Email"
        placeholderTextColor="#8A8A8A"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        // 👇 Añadido para reconocimiento del sistema
        textContentType="username" // iOS
        autoComplete="username" // Android / web
        autoCorrect={false}
        style={{
          backgroundColor: "#1A1A1A",
          color: "white",
          padding: 14,
          borderRadius: 12,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#242424",
        }}
      />

      <TextInput
        placeholder="Contraseña"
        placeholderTextColor="#8A8A8A"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        // 👇 Añadido para sugerir contraseñas guardadas
        textContentType="password" // iOS
        autoComplete="password" // Android / web
        style={{
          backgroundColor: "#1A1A1A",
          color: "white",
          padding: 14,
          borderRadius: 12,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: "#242424",
        }}
      />

      <Pressable
        onPress={onLogin}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#7A0A0A" : "#C20F0F",
          padding: 14,
          borderRadius: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
          {loading ? "Entrando..." : "Entrar"}
        </Text>
      </Pressable>
    </View>
  );
}
