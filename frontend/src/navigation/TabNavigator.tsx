import Ionicons from "@expo/vector-icons/Ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { Platform } from "react-native";
import { useThemeContext } from "../hooks/use-theme-context";
import { AvisosScreen } from "../screens/AvisosScreen";
import { LinesScreen } from "../screens/LineasScreen";
import { ParadasScreen } from "../screens/ParadasScreen";
import { PerfilScreen } from "../screens/PerfilScreen";

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  const { paleta } = useThemeContext();

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
          height: Platform.OS === "ios" ? 84 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
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
