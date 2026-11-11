import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";

interface LineaHeaderProps {
  numero: string;
  nombre: string;
  color: string;
  esFavorita?: boolean;
  onPressVolver: () => void;
  onToggleFavorita?: () => void;
}

export const LineaHeader: React.FC<LineaHeaderProps> = ({
  numero,
  nombre,
  color,
  esFavorita = false,
  onPressVolver,
  onToggleFavorita,
}) => {
  const { paleta } = useThemeContext();

  return (
    <View style={styles.header}>
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

      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeTexto}>{numero}</Text>
      </View>

      <Text
        style={[styles.nombre, { color: paleta.textoAlto }]}
        numberOfLines={1}
      >
        {nombre}
      </Text>

      {onToggleFavorita ? (
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
          accessibilityLabel={
            esFavorita ? "Quitar línea de favoritas" : "Marcar línea como favorita"
          }
        >
          <Ionicons
            name={esFavorita ? "star" : "star-outline"}
            size={21}
            color={esFavorita ? "#F59E0B" : paleta.textoMedio}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    minWidth: 40,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeTexto: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  nombre: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
});
