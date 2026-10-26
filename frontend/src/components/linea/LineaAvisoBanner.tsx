import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";

interface LineaAvisoBannerProps {
  titulo?: string;
  vigencia?: string;
  onPressVerAviso?: () => void;
}

export const LineaAvisoBanner: React.FC<LineaAvisoBannerProps> = ({
  titulo = "Desvío por obra en Corrientes",
  vigencia = "Hasta el 5/10",
  onPressVerAviso,
}) => {
  const { paleta } = useThemeContext();
  const estiloAviso = paleta.gravedadAviso.desvio;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: estiloAviso.fondo,
          borderColor: estiloAviso.borde,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Ionicons name="warning" size={18} color={estiloAviso.texto} />
        <Text style={[styles.titulo, { color: paleta.textoAlto }]}>
          {titulo}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <Text style={[styles.vigencia, { color: paleta.textoMedio }]}>
          {vigencia} ·{" "}
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPressVerAviso}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={[styles.linkVerAviso, { color: paleta.textoAlto }]}>
            Ver aviso
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titulo: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginLeft: 26,
  },
  vigencia: {
    fontSize: 13,
    fontWeight: "500",
  },
  linkVerAviso: {
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
