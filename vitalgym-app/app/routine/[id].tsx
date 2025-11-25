import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { apiAuth } from "../../lib/api";

type RoutineExercise = {
  id: number; // ESTE es el que usaremos para pedir el detalle
  routineId: number;
  exerciseId: number;
  dia: number;
  series: string;
  notas?: string;
  descansoSegundos?: number;
};

type RoutineResponse = {
  id: number;
  nombre?: string;
  descripcion?: string;
  RoutineExercises: RoutineExercise[];
};

type RoutineExerciseDetail = {
  id: number; // id del routineExercise
  routineId: number;
  exerciseId: number;
  dia: number;
  series: string;
  notas?: string;
  descansoSegundos?: number;
  exercise?: {
    id: number;
    nombre?: string;
    descripcion?: string;
    categoria?: string;
    imagenUrl?: string;
    videoUrl?: string;
  };
};

const BASE_URL = "https://vitalgym.fit";

export default function RoutineMine() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState<RoutineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // ahora el mapa es por routineExerciseId -> detalle
  const [reMap, setReMap] = useState<Record<number, RoutineExerciseDetail>>({});

  // obtiene 1 routine-exercise por id (el nuevo endpoint)
  const fetchRoutineExerciseById = useCallback(
    async (routineExerciseId: number): Promise<RoutineExerciseDetail | null> => {
      try {
        const res = await apiAuth.get(
          `/client/routine-exercises/${routineExerciseId}`
        );
        return res.data;
      } catch (e: any) {
        console.log(
          "No se pudo obtener el routine-exercise",
          routineExerciseId,
          e?.response?.data || e.message
        );
        return null;
      }
    },
    []
  );

  // agrupa el array RoutineExercises por dia
  const groupByDay = (recs: RoutineExercise[]) => {
    const days: Record<number, RoutineExercise[]> = {};
    for (const rec of recs) {
      if (!days[rec.dia]) days[rec.dia] = [];
      days[rec.dia].push(rec);
    }
    return Object.keys(days)
      .map((d) => Number(d))
      .sort((a, b) => a - b)
      .map((dia) => ({ dia, items: days[dia] }));
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) rutina del cliente
        const { data } = await apiAuth.get("/client/my-routine");
        setRoutine(data);

        // 2) ids únicos de routine-exercise (OJO, no de exerciseId)
        const reIds = Array.from(
          new Set(data.RoutineExercises.map((r: RoutineExercise) => r.id))
        );

        // 3) descargar detalles en paralelo
        const results = await Promise.all(
          reIds.map((rid) => fetchRoutineExerciseById(rid))
        );

        const map: Record<number, RoutineExerciseDetail> = {};
        results.forEach((detail, idx) => {
          const reId = reIds[idx];
          if (detail) map[reId] = detail;
        });
        setReMap(map);
      } catch (e: any) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "No se pudo cargar la rutina."
        );
        setRoutine(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchRoutineExerciseById]);

  // parsea "[10,10,10]" → ["10","10","10"]
  function parseSeries(seriesStr: string | undefined) {
    if (!seriesStr) return [];
    try {
      const arr = JSON.parse(seriesStr);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  // arma la url de imagen desde el detalle
  function getExerciseImage(detail?: RoutineExerciseDetail): string | undefined {
    const path = detail?.exercise?.imagenUrl;
    if (!path) return;
    if (path.startsWith("http")) return path;
    return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  }

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
          Cargando rutina…
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0E0E0E", padding: 16 }}>
        <Text style={{ color: "#ff8a8a", marginBottom: 12 }}>{error}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: "white" }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0E0E0E", padding: 16 }}>
        <Text style={{ color: "white" }}>Rutina no encontrada.</Text>
      </View>
    );
  }

  const days = groupByDay(routine.RoutineExercises || []);

  return (
    <View style={{ flex: 1, backgroundColor: "#0E0E0E" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 90, gap: 14 }}
      >
        {/* Cabecera */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
          </Pressable>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>
            {routine.nombre || "Mi rutina"}
          </Text>
        </View>

        {routine.descripcion ? (
          <Text style={{ color: "#BDBDBD" }}>{routine.descripcion}</Text>
        ) : null}

        {days.map(({ dia, items }) => (
          <View key={dia} style={{ gap: 10 }}>
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "700",
                marginTop: 10,
              }}
            >
              Día {dia}
            </Text>

            {items.map((rx) => {
              const detail = reMap[rx.id]; // 👈 ahora por routineExerciseId
              const name =
                detail?.exercise?.nombre ||
                detail?.exercise?.name ||
                `Ejercicio #${rx.exerciseId}`;
              const parsedSeries = parseSeries(rx.series);
              const totalSeries = parsedSeries.length;
              const repsText =
                parsedSeries.length > 0 ? parsedSeries.join("/") : "—";
              const img = getExerciseImage(detail);

              return (
                <Pressable
                  key={rx.id}
                  onPress={() =>
                    router.push({
                      pathname: "/exercise/[id]",
                      // ojo: ahora queremos ir al routine-exercise, no al exercise genérico
                      params: {
                        id: String(rx.id), // 👈 pasamos el routineExerciseId
                      },
                    })
                  }
                  style={{
                    flexDirection: "row",
                    backgroundColor: "#151515",
                    borderWidth: 1,
                    borderColor: "#232323",
                    borderRadius: 12,
                    padding: 12,
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  {/* imagen */}
                  {img ? (
                    <Image
                      source={{ uri: img }}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 10,
                        backgroundColor: "#202020",
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 10,
                        backgroundColor: "#202020",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 11 }}>
                        {rx.exerciseId}
                      </Text>
                    </View>
                  )}

                  {/* info */}
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 15,
                        fontWeight: "700",
                      }}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    <Text style={{ color: "#BDBDBD", fontSize: 13 }}>
                      {totalSeries} serie{totalSeries === 1 ? "" : "s"} -{" "}
                      {repsText} reps
                      {rx.descansoSegundos
                        ? ` • ${rx.descansoSegundos}s descanso`
                        : ""}
                    </Text>
                  </View>

                  <Text style={{ color: "#fff", fontSize: 20 }}>⋮</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
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
