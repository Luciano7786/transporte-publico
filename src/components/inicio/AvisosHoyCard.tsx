import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";

interface AvisosHoyCardProps {
  titulo?: string;
  mensaje?: string;
  onPress?: () => void;
}

export const AvisosHoyCard: React.FC<AvisosHoyCardProps> = ({
  titulo = "Avisos de hoy",
  mensaje = "L2, L7 y L9: desvío por obra en calle Corrientes",
  onPress,
}) => {
  const { paleta } = useThemeContext();
  const estiloAviso = paleta.gravedadAviso.desvio;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: estiloAviso.fondo,
          borderColor: estiloAviso.borde,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Ionicons name="warning" size={18} color={estiloAviso.texto} />
        <Text style={[styles.titulo, { color: estiloAviso.texto }]}>
          {titulo}
        </Text>
      </View>

      <Text style={[styles.mensaje, { color: paleta.textoAlto }]}>
        {mensaje}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  titulo: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },
  mensaje: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    marginLeft: 24,
  },
});
