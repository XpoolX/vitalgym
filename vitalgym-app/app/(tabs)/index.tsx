import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
  Pressable,
} from "react-native";
import { apiAuth } from "../../lib/api";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";

type UserMe = {
  id?: number;
  name?: string;
  nombre?: string;
  email?: string;
  idLlave?: string | number;
  status?: "ALTA" | "BAJA" | string;
  estado?: string;
  imagen?: string;
  foto?: string;
  avatar?: string;
};

type UserStats = {
  ultimaSesion?: string;
  entrenosSemana?: number;
  entrenosMes?: number;
  entrenosAnio?: number;
  promedioSemanal?: number;
  promedioMensual?: number;
  totalEntrenos?: number;
  rachaActual?: number;
  fechaRegistro?: string;
};

type TrainingDay = {
  currentTrainingDay?: number;
  totalDays?: number;
  routineName?: string;
};

const SECURE_USER_KEY = "user";

function decodeJwtFromApiAuth(): UserMe | null {
  try {
    const auth = apiAuth.defaults.headers.common?.Authorization;
    if (!auth) return null;
    const token = auth.replace("Bearer ", "").trim();
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    let decoded = "";
    if (typeof atob === "function") {
      decoded = atob(base64);
    } else {
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

function getAvatarUri(user: UserMe | null): string | undefined {
  if (!user) return;
  return user.imagen || undefined;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateString?: string): string {
  if (!dateString) return "Nunca";
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

export default function HomeProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserMe | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [trainingDay, setTrainingDay] = useState<TrainingDay | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      // Fetch user data
      const saved = await SecureStore.getItemAsync(SECURE_USER_KEY);
      if (saved) {
        const parsed: UserMe = JSON.parse(saved);
        setUser(parsed);
      } else {
        try {
          const res = await apiAuth.get("/users/me");
          setUser(res.data);
        } catch (err: any) {
          const status = err?.response?.status;
          if (status === 404 || status === 403) {
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
      }

      // Fetch stats
      try {
        const statsRes = await apiAuth.get("/client/my-stats");
        setStats(statsRes.data);
      } catch (err) {
        console.log("No se pudieron cargar estadísticas");
      }

      // Fetch current training day
      try {
        const trainingRes = await apiAuth.get("/client/current-training-day");
        setTrainingDay(trainingRes.data);
      } catch (err) {
        console.log("No se pudo cargar el día de entrenamiento");
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
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const goToTraining = () => {
    router.push("/training");
  };

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
        <ActivityIndicator color="#C20F0F" size="large" />
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
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#C20F0F"
        />
      }
    >
      {/* Profile Header */}
      <View
        style={{
          backgroundColor: "#151515",
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: "#252525",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
          }}
        >
          {avatarUri ? (
            <Image
              source={{ uri: "https://vitalgym.fit" + avatarUri }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 3,
                borderColor: "#C20F0F",
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#C20F0F",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: "#ff3355",
              }}
            >
              <Text style={{ color: "white", fontWeight: "800", fontSize: 32 }}>
                {displayName !== "—" ? displayName[0]?.toUpperCase() : "?"}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>
              {displayName}
            </Text>
            <Text style={{ color: "#888", fontSize: 14, marginTop: 2 }}>
              {user?.email ?? "Sin correo"}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 8,
                gap: 8,
              }}
            >
              <View
                style={{
                  backgroundColor: displayStatus === "ALTA" ? "#1a3a1a" : "#3a2a1a",
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: displayStatus === "ALTA" ? "#73E38E" : "#FFA657",
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {displayStatus}
                </Text>
              </View>
              {stats?.fechaRegistro && (
                <Text style={{ color: "#666", fontSize: 11 }}>
                  Desde {formatDate(stats.fechaRegistro)}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {error ? (
        <Text style={{ color: "#ff8a8a", marginBottom: 12 }}>{error}</Text>
      ) : null}

      {/* Next Training Card */}
      {trainingDay && (
        <Pressable
          onPress={goToTraining}
          style={{
            backgroundColor: "#C20F0F",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" }}>
                SIGUIENTE ENTRENAMIENTO
              </Text>
              <Text style={{ color: "white", fontSize: 24, fontWeight: "800", marginTop: 4 }}>
                Día {trainingDay.currentTrainingDay}
              </Text>
              {trainingDay.routineName && (
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 2 }}>
                  {trainingDay.routineName}
                </Text>
              )}
            </View>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                width: 50,
                height: 50,
                borderRadius: 25,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 24 }}>💪</Text>
            </View>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 12 }}>
            Toca para empezar →
          </Text>
        </Pressable>
      )}

      {/* Statistics Section */}
      <Text style={{ color: "white", fontSize: 18, fontWeight: "800", marginBottom: 12 }}>
        📊 Mis Estadísticas
      </Text>

      <View style={{ gap: 12 }}>
        {/* Top stats row */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "#151515",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#252525",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 28 }}>🔥</Text>
            <Text style={{ color: "white", fontSize: 28, fontWeight: "800", marginTop: 4 }}>
              {stats?.rachaActual ?? 0}
            </Text>
            <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
              Racha actual
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: "#151515",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#252525",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 28 }}>💪</Text>
            <Text style={{ color: "white", fontSize: 28, fontWeight: "800", marginTop: 4 }}>
              {stats?.totalEntrenos ?? 0}
            </Text>
            <Text style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
              Total entrenos
            </Text>
          </View>
        </View>

        {/* Stats cards */}
        <View
          style={{
            backgroundColor: "#151515",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#252525",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ color: "#888", fontSize: 11 }}>Esta semana</Text>
              <Text style={{ color: "white", fontSize: 20, fontWeight: "700", marginTop: 4 }}>
                {stats?.entrenosSemana ?? 0}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "#333" }} />
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ color: "#888", fontSize: 11 }}>Este mes</Text>
              <Text style={{ color: "white", fontSize: 20, fontWeight: "700", marginTop: 4 }}>
                {stats?.entrenosMes ?? 0}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "#333" }} />
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ color: "#888", fontSize: 11 }}>Este año</Text>
              <Text style={{ color: "white", fontSize: 20, fontWeight: "700", marginTop: 4 }}>
                {stats?.entrenosAnio ?? 0}
              </Text>
            </View>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: "#333", paddingTop: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 16 }}>📈</Text>
                <Text style={{ color: "#888", fontSize: 13 }}>Promedio semanal</Text>
              </View>
              <Text style={{ color: "white", fontWeight: "700" }}>
                {stats?.promedioSemanal ?? 0} entrenos
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 16 }}>🕐</Text>
                <Text style={{ color: "#888", fontSize: 13 }}>Última sesión</Text>
              </View>
              <Text style={{ color: "white", fontWeight: "700" }}>
                {formatDateTime(stats?.ultimaSesion)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={{ color: "#555", marginTop: 20, fontSize: 12, textAlign: "center" }}>
        Desliza hacia abajo para actualizar
      </Text>
    </ScrollView>
  );
}
