import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="lineas-screen"
        options={{
          title: "Líneas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="paradas-screen" options={{
          title: "Paradas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location" size={size} color={color} />
          ),
        }} />
      <Tabs.Screen name="avisos-screen" options={{
          title: "Avisos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="warning" size={size} color={color} />
          ),
        }} />
      <Tabs.Screen name="perfil-screen" options={{
          title: "Yo",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }} />
    </Tabs>
  );
}
