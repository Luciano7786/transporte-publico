import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/contexts/AuthContext";
import { ThemeContextProvider } from "./src/contexts/ThemeContext";
import { useThemeContext } from "./src/hooks/use-theme-context";
import { TabNavigator } from "./src/navigation/TabNavigator";
import { LineaDetalleScreen } from "./src/screens/LineaDetalleScreen";
import { ParadaDetalleScreen } from "./src/screens/ParadaDetalleScreen";
import { ReportarDemoraScreen } from "./src/screens/ReportarDemoraScreen";

const Stack = createNativeStackNavigator();

function MainNavigation() {
  const { temaActual, paleta } = useThemeContext();

  return (
    <>
      <StatusBar style={temaActual === "dark" ? "light" : "dark"} />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: paleta.fondoApp },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="ParadaDetalle" component={ParadaDetalleScreen} />
          <Stack.Screen name="LineaDetalle" component={LineaDetalleScreen} />
          <Stack.Screen name="ReportarDemora" component={ReportarDemoraScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeContextProvider>
        <AuthProvider>
          <MainNavigation />
        </AuthProvider>
      </ThemeContextProvider>
    </SafeAreaProvider>
  );
}
