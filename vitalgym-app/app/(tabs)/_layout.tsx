// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: "#0E0E0E" },
        headerTintColor: "#fff",
        tabBarStyle: { backgroundColor: "#0E0E0E", borderTopColor: "#222" },
        tabBarActiveTintColor: "#C20F0F",
        tabBarInactiveTintColor: "#9a9a9a",
        headerTitleStyle: { fontWeight: "800" },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          
          if (route.name === "index") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "routines") {
            iconName = focused ? "barbell" : "barbell-outline";
          } else if (route.name === "profile") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "ellipse";
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="routines" options={{ title: "Rutinas" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}
