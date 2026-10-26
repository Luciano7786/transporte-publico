import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";

interface ParadaHeaderProps {
  nombre: string;
  esFavorita?: boolean;
  onPressVolver: () => void;
  onToggleFavorita?: () => void;
}

export const ParadaHeader: React.FC<ParadaHeaderProps> = ({
  nombre,
  esFavorita = true,
  onPressVolver,
  onToggleFavorita,
}) => {
  const { paleta } = useThemeContext();

  return (
    <View style={styles.header}>
      {/* Botón Volver */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPressVolver}
        style={[
          styles.iconButton,
          {
            backgroundColor: paleta.superficie1,
            borderColor: paleta.borde,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Volver atrás"
      >
        <Ionicons name="chevron-back" size={22} color={paleta.textoAlto} />
      </TouchableOpacity>

      {/* Nombre de la parada */}
      <Text
        style={[styles.nombre, { color: paleta.textoAlto }]}
        numberOfLines={1}
      >
        {nombre}
      </Text>

      {/* Botón Favorita */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggleFavorita}
        style={[
          styles.iconButton,
          {
            backgroundColor: paleta.superficie1,
            borderColor: paleta.borde,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Marcar parada como favorita"
      >
        <Ionicons
          name={esFavorita ? "star" : "star-outline"}
          size={20}
          color={esFavorita ? "#f5a524" : paleta.textoBajo}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 12,
  },
  nombre: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "left",
    letterSpacing: -0.3,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
