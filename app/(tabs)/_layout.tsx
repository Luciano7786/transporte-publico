import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="lineas-screen"
        options={{ title: "Paradas Cerca" }}
      />
      <Tabs.Screen name="paradas-screen" options={{ title: "Líneas" }} />
      <Tabs.Screen name="avisos-screen" options={{ title: "Escanear QR" }} />
      <Tabs.Screen name="perfil-screen" options={{ title: "Favoritos" }} />
    </Tabs>
  );
}
