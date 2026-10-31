import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/contexts/AuthContext";
import { ThemeContextProvider } from "./src/contexts/ThemeContext";
import { useThemeContext } from "./src/hooks/use-theme-context";
import { TabNavigator } from "./src/navigation/TabNavigator";
import { LineaDetalleScreen } from "./src/screens/LineaDetalleScreen";
import { ParadaDetalleScreen } from "./src/screens/ParadaDetalleScreen";
import { ReportarDemoraScreen } from "./src/screens/ReportarDemoraScreen";
import { AuthContext } from "./src/contexts/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";

const Stack = createNativeStackNavigator();

function MainNavigation() {
  const { temaActual, paleta } = useThemeContext();
  const auth = useContext(AuthContext);

  // Si todavía está restaurando la sesión o cargando, puedes mostrar un splash o null
  if (!auth) return null;

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
          {auth.usuario ? (
            // Si el usuario está logueado, mostramos las pantallas principales de la app
            <>
              <Stack.Screen name="MainTabs" component={TabNavigator} />
              <Stack.Screen name="ParadaDetalle" component={ParadaDetalleScreen} />
              <Stack.Screen name="LineaDetalle" component={LineaDetalleScreen} />
              <Stack.Screen name="ReportarDemora" component={ReportarDemoraScreen} />
            </>
          ) : (
            // Si no está logueado, lo mandamos directo a la pantalla de Login
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
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
