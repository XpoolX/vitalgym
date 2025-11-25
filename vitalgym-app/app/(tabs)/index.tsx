import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
} from "react-native";
import { apiAuth } from "../../lib/api";
import * as SecureStore from "expo-secure-store";

type UserMe = {
  id?: number;
  name?: string;
  nombre?: string;         // por si viene así
  email?: string;
  idLlave?: string | number;
  status?: "ALTA" | "BAJA" | string;
  estado?: string;         // por si viene así
  imagen?: string;
  foto?: string;
  avatar?: string;
};

const SECURE_USER_KEY = "user";

// helper para decodificar el JWT si hace falta
function decodeJwtFromApiAuth(): UserMe | null {
  try {
    const auth = apiAuth.defaults.headers.common?.Authorization;
    if (!auth) return null;
    const token = auth.replace("Bearer ", "").trim();
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // intentar usar atob; si no existe, no pasa nada
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    let decoded = "";
    if (typeof atob === "function") {
      decoded = atob(base64);
    } else {
      // RN a veces no trae atob: lo intentamos con Buffer si está
      // @ts-ignore
      decoded = Buffer.from(base64, "base64").toString("utf8");
    }

    const payload = JSON.parse(decoded);
    return {
      id: payload.id || payload.userId,
      name: payload.name || payload.nombre,
      email: payload.email,
      status: payload.status,
      idLlave: payload.idLlave,
    };
  } catch {
    return null;
  }
}

// saca la url de foto de cualquiera de los campos que puedas tener
function getAvatarUri(user: UserMe | null): string | undefined {
  if (!user) return;
  console.log("User avatar fields:", {
    imagenUrl: user.imagen
  });
  return (
    user.imagen ||
    undefined
  );
}

export default function HomeProfile() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserMe | null>(null);

  const fetchMe = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      // 1) leer del secure store
      const saved = await SecureStore.getItemAsync(SECURE_USER_KEY);
      if (saved) {
        const parsed: UserMe = JSON.parse(saved);
        setUser(parsed);
        setLoading(false);
        return;
      }

      // 2) si no hay guardado, intento la ruta del backend
      try {
        const res = await apiAuth.get("/users/me");
        setUser(res.data);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404 || status === 403) {
          // 3) último recurso: token
          const fromToken = decodeJwtFromApiAuth();
          if (fromToken) {
            setUser(fromToken);
          } else {
            setError("No se pudieron cargar tus datos.");
            setUser(null);
          }
        } else {
          throw err;
        }
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "No se pudieron cargar tus datos."
      );
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMe();
    setRefreshing(false);
  }, [fetchMe]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0E0E0E",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
        <Text style={{ color: "#9a9a9a", marginTop: 8 }}>
          Cargando tu perfil…
        </Text>
      </View>
    );
  }

  const displayName = user?.name || user?.nombre || "—";
  const displayStatus = user?.status || user?.estado || "—";
  const avatarUri = getAvatarUri(user);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0E0E0E" }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fff"
        />
      }
    >
      <Text
        style={{
          color: "white",
          fontSize: 22,
          fontWeight: "800",
          marginBottom: 16,
        }}
      >
        Mi perfil
      </Text>

      {/* Cabecera con foto */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          marginBottom: 16,
        }}
      >
        {avatarUri ? (
          <Image
            source={{ uri: "https://vitalgym.fit"+avatarUri }}
            style={{
              width: 64,
              height: 64,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: "#2e2e2e",
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 9999,
              backgroundColor: "#1f1f1f",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 20 }}>
              {displayName !== "—" ? displayName[0]?.toUpperCase() : "?"}
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
            {displayName}
          </Text>
          <Text style={{ color: "#a1a1a1" }}>
            {user?.email ?? "Sin correo"}
          </Text>
        </View>
      </View>

      {error ? (
        <Text style={{ color: "#ff8a8a", marginBottom: 12 }}>{error}</Text>
      ) : null}

      <View
        style={{
          backgroundColor: "#151515",
          borderWidth: 1,
          borderColor: "#232323",
          borderRadius: 14,
          padding: 16,
          gap: 14,
        }}
      >
        <View style={{ gap: 4 }}>
          <Text style={{ color: "#BDBDBD", fontSize: 12 }}>Correo</Text>
          <Text style={{ color: "white", fontSize: 16 }}>
            {user?.email ?? "—"}
          </Text>
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ color: "#BDBDBD", fontSize: 12 }}>Estado</Text>
          <Text
            style={{
              color: displayStatus === "ALTA" ? "#73E38E" : "#FFA657",
              fontWeight: "800",
              fontSize: 15,
            }}
          >
            {displayStatus}
          </Text>
        </View>
      </View>

      <Text style={{ color: "#8A8A8A", marginTop: 14, lineHeight: 20 }}>
        Si no ves cambios, desliza para refrescar. Si esta pantalla no se carga
        después del login, comprueba que estás guardando también el usuario en
        SecureStore junto con el token.
      </Text>
    </ScrollView>
  );
}
