// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  const Icon = ({ label }: { label: string }) => (
    <Text style={{ fontSize: 18, lineHeight: 20 }}>{label}</Text>
  );

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: "#0E0E0E" },
        headerTintColor: "#fff",
        tabBarStyle: { backgroundColor: "#0E0E0E", borderTopColor: "#222" },
        tabBarActiveTintColor: "#C20F0F",
        tabBarInactiveTintColor: "#9a9a9a",
        headerTitleStyle: { fontWeight: "800" },
        tabBarIcon: ({ focused }) => {
          const map: Record<string, { on: string; off: string }> = {
            index:   { on: "🏠", off: "🏡" },
            routines:{ on: "🏋️‍♂️", off: "🏋️" },
            profile: { on: "👤", off: "🙂" },
          };
          const pair = map[route.name] ?? { on: "⬤", off: "◯" };
          return <Icon label={focused ? pair.on : pair.off} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="routines" options={{ title: "Rutinas" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
