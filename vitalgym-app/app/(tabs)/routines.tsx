// app/(tabs)/routines.tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { apiAuth } from "../../lib/api";
import { useRouter } from "expo-router";

type Routine = {
  id: number;
  name: string;
  description?: string;
};

export default function Routines() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Routine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) primero: rutina del cliente autenticado
        const res = await apiAuth.get("/client/my-routine");
        const data = res.data;

        // puede venir como objeto { id, name/nombre, ... }
        const one: Routine = {
          id: data.id,
          name: data.name || data.nombre || "Rutina sin nombre",
          description: data.description || data.descripcion || "",
        };

        setItems([one]);
      } catch (err: any) {
        // si no existe o no tiene rutina, probamos como admin
        const status = err?.response?.status;
        if (status === 404 || status === 403) {
          try {
            const res2 = await apiAuth.get("/admin/routines");
            const list = Array.isArray(res2.data) ? res2.data : [];
            const mapped: Routine[] = list.map((r: any) => ({
              id: r.id,
              name: r.name || r.nombre || "Rutina sin nombre",
              description: r.description || r.descripcion || "",
            }));
            setItems(mapped);
          } catch (err2: any) {
            setError(
              err2?.response?.data?.message ||
                err2?.message ||
                "No se pudieron cargar las rutinas."
            );
            setItems([]);
          }
        } else {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "No se pudieron cargar las rutinas."
          );
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
          Cargando rutinas…
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0E0E0E", padding: 16 }}>
      <Text
        style={{
          color: "white",
          fontSize: 22,
          fontWeight: "800",
          marginBottom: 12,
        }}
      >
        Mis rutinas
      </Text>

      {error ? (
        <Text style={{ color: "#ff8a8a", marginBottom: 12 }}>{error}</Text>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/routine/${item.id}`)}
            style={{
              backgroundColor: "#151515",
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#232323",
            }}
          >
            <Text
              style={{ color: "white", fontSize: 18, fontWeight: "700" }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.description ? (
              <Text
                style={{ color: "#BDBDBD", marginTop: 6 }}
                numberOfLines={3}
              >
                {item.description}
              </Text>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text
            style={{ color: "#9a9a9a", textAlign: "center", marginTop: 24 }}
          >
            No tienes rutinas asignadas todavía.
          </Text>
        }
      />
    </View>
  );
}
