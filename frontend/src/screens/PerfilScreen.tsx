import React from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeContext } from "../hooks/use-theme-context";

export function PerfilScreen() {
  const { paleta } = useThemeContext();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: paleta.fondoApp }]}>
      <Text style={[styles.title, { color: paleta.textoAlto }]}>
        Mi Perfil
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "bold" },
});
