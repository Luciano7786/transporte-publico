import Ionicons from "@expo/vector-icons/Ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useContext } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../contexts/AuthContext";
import { useThemeContext } from "../hooks/use-theme-context";
import { esDireccion } from "../services/admin.service";
import { AdminScreen } from "../screens/AdminScreen";
import { AvisosScreen } from "../screens/AvisosScreen";
import { LinesScreen } from "../screens/LineasScreen";
import { ParadasScreen } from "../screens/ParadasScreen";
import { PerfilScreen } from "../screens/PerfilScreen";

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  const { paleta } = useThemeContext();
  const auth = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const paddingInferior = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      initialRouteName="Paradas"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: paleta.acento,
        tabBarInactiveTintColor: paleta.textoBajo,
        tabBarStyle: {
          backgroundColor: paleta.superficie1,
          borderTopColor: paleta.borde,
          borderTopWidth: 1,
          height: 58 + paddingInferior,
          paddingTop: 8,
          paddingBottom: paddingInferior,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tab.Screen
        name="Lineas"
        component={LinesScreen}
        options={{
          title: "Líneas",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "menu" : "menu-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Paradas"
        component={ParadasScreen}
        options={{
          title: "Paradas",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "bus" : "bus-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Avisos"
        component={AvisosScreen}
        options={{
          title: "Avisos",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "warning" : "warning-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      {esDireccion(auth?.usuario?.email) ? (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            title: "Admin",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "shield-checkmark" : "shield-checkmark-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ) : null}
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          title: "Yo",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
