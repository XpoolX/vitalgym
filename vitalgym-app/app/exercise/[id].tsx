// app/exercise/[id].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Image,
  Pressable,
} from "react-native";
import { apiAuth } from "../../lib/api";

const BASE_URL = "https://vitalgym.fit";

type RoutineExerciseDetail = {
  id: number; // id del routineExercise
  routineId: number;
  exerciseId: number;
  dia: number;
  series: string; // viene como "[10,10,10]"
  repeticiones?: number;
  descansoSegundos?: number;
  notas?: string;
  exercise?: {
    id: number;
    nombre?: string;
    descripcion?: string;
    categoria?: string;
    imagenUrl?: string;
    videoUrl?: string;
  };
};

export default function ExerciseScreen() {
  const { id } = useLocalSearchParams(); // ESTE es el routineExerciseId
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<RoutineExerciseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // helper para parsear las series que vienen como string
  function parseSeries(seriesStr?: string): number[] {
    if (!seriesStr) return [];
    try {
      const arr = JSON.parse(seriesStr);
      return Array.isArray(arr) ? arr.map(Number) : [];
    } catch {
      return [];
    }
  }

  function getImageUrl(path?: string) {
    if (!path) return undefined;
    if (path.startsWith("http")) return path;
    return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiAuth.get(`/client/routine-exercises/${id}`);
        setDetail(res.data);
      } catch (e: any) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "No se pudo cargar el ejercicio."
        );
        setDetail(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
          Cargando ejercicio…
        </Text>
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0E0E0E", padding: 16 }}>
        <Text style={{ color: "#ff8a8a", marginBottom: 12 }}>
          {error || "Ejercicio no encontrado."}
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: "white" }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const title = detail.exercise?.nombre || `Ejercicio #${detail.exerciseId}`;
  const img = getImageUrl(detail.exercise?.imagenUrl);
  const series = parseSeries(detail.series);
  const descanso = detail.descansoSegundos;

  return (
    <View style={{ flex: 1, backgroundColor: "#0E0E0E" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* cabecera con imagen */}
        <View style={{ height: 220, backgroundColor: "#141414" }}>
          {img ? (
            <Image
              source={{ uri: img }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : null}

          {/* botón atrás */}
          <Pressable
            onPress={() => router.back()}
            style={{ position: "absolute", top: 40, left: 16 }}
          >
            <Text style={{ color: "white", fontSize: 20 }}>←</Text>
          </Pressable>

          {/* título + like */}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: 16,
              backgroundColor: "rgba(14,14,14,0.4)",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>
              {title}
            </Text>
            <Pressable onPress={() => {}}>
              <Text style={{ color: "white", fontSize: 20 }}>♡</Text>
            </Pressable>
          </View>
        </View>

        {/* contenido */}
        <View style={{ padding: 16, gap: 18 }}>
          {/* barra de acciones */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={{ color: "white" }}>⏱</Text>
              <Text style={{ color: "white", fontSize: 12 }}>
                {descanso ? `${(descanso / 60).toFixed(0).padStart(2, "0")}:00` : "02:00"}
              </Text>
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={{ color: "white" }}>▶</Text>
              <Text style={{ color: "white", fontSize: 12 }}>Instrucciones</Text>
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={{ color: "white" }}>📊</Text>
              <Text style={{ color: "white", fontSize: 12 }}>Analíticas</Text>
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={{ color: "white" }}>🏋</Text>
              <Text style={{ color: "white", fontSize: 12 }}>Discos</Text>
            </View>
          </View>

          {/* Sets de calentamiento (mock) */}
          <View style={{ gap: 10 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                style={{ color: "white", fontSize: 15, fontWeight: "700" }}
              >
                Sets de calentamiento
              </Text>
              <Pressable onPress={() => {}}>
                <Text style={{ color: "#C6FF00" }}>Ocultar</Text>
              </Pressable>
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: "#151515",
                  borderWidth: 1,
                  borderColor: "#232323",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "white" }}>1</Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#151515",
                  borderWidth: 1,
                  borderColor: "#232323",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <Text style={{ color: "#BDBDBD", fontSize: 12 }}>
                  REPETICIONES
                </Text>
                <Text style={{ color: "white", fontSize: 15 }}>12</Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#151515",
                  borderWidth: 1,
                  borderColor: "#232323",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <Text style={{ color: "#BDBDBD", fontSize: 12 }}>TOTAL KG</Text>
                <Text style={{ color: "white", fontSize: 15 }}>27.5</Text>
              </View>
            </View>
          </View>

          {/* Series efectivas */}
          <View style={{ gap: 10 }}>
            <Text
              style={{ color: "white", fontSize: 15, fontWeight: "700" }}
            >
              Series efectivas
            </Text>

            {series.length === 0 ? (
              <Text style={{ color: "#9a9a9a" }}>
                Este ejercicio no tiene series definidas.
              </Text>
            ) : (
              series.map((reps, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: "#151515",
                      borderWidth: 1,
                      borderColor: "#232323",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "white" }}>{index + 1}</Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#151515",
                      borderWidth: 1,
                      borderColor: "#232323",
                      borderRadius: 10,
                      padding: 10,
                    }}
                  >
                    <Text style={{ color: "#BDBDBD", fontSize: 12 }}>
                      REPETICIONES
                    </Text>
                    <Text style={{ color: "white", fontSize: 15 }}>
                      {reps}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#151515",
                      borderWidth: 1,
                      borderColor: "#232323",
                      borderRadius: 10,
                      padding: 10,
                    }}
                  >
                    <Text style={{ color: "#BDBDBD", fontSize: 12 }}>
                      TOTAL KG
                    </Text>
                    <Text style={{ color: "white", fontSize: 15 }}>55</Text>
                  </View>
                </View>
              ))
            )}

            <Pressable onPress={() => {}} style={{ marginTop: 4 }}>
              <Text style={{ color: "#C6FF00", fontWeight: "600" }}>
                + Añadir serie
              </Text>
            </Pressable>
          </View>

          {/* Notas */}
          <View style={{ gap: 6 }}>
            <Text style={{ color: "white", fontWeight: "700" }}>Notas</Text>
            <View
              style={{
                backgroundColor: "#151515",
                borderWidth: 1,
                borderColor: "#232323",
                borderRadius: 12,
                minHeight: 70,
                padding: 10,
              }}
            >
              <Text style={{ color: "#8A8A8A" }}>
                {detail.notas && detail.notas.trim().length > 0
                  ? detail.notas
                  : "Aquí puedes escribir cómo te fue el ejercicio..."}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* botón fijo */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          backgroundColor: "rgba(14,14,14,0.9)",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#C6FF00",
            paddingVertical: 14,
            borderRadius: 9999,
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 15 }}>
            COMENZAR ENTRENAMIENTO
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
