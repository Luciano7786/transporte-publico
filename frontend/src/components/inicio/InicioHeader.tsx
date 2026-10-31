import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";

interface InicioHeaderProps {
  titulo?: string;
  onPressQr?: () => void;
}

export const InicioHeader: React.FC<InicioHeaderProps> = ({
  titulo = "Paraná",
  onPressQr,
}) => {
  const { paleta } = useThemeContext();

  return (
    <View style={styles.header}>
      <Text style={[styles.titulo, { color: paleta.textoAlto }]}>{titulo}</Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPressQr}
        style={[
          styles.qrButton,
          {
            backgroundColor: paleta.superficie1,
            borderColor: paleta.borde,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Escanear código QR de la parada"
      >
        <Ionicons name="qr-code-outline" size={22} color={paleta.textoAlto} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  qrButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
