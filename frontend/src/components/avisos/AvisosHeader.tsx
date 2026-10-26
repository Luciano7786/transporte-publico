import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";

interface AvisosHeaderProps {
  titulo?: string;
}

export const AvisosHeader: React.FC<AvisosHeaderProps> = ({
  titulo = "Avisos",
}) => {
  const { paleta } = useThemeContext();

  return (
    <View style={styles.header}>
      <Text style={[styles.titulo, { color: paleta.textoAlto }]}>{titulo}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
});
