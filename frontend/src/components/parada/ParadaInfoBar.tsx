import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";

interface ParadaInfoBarProps {
  distancia?: string;
  sentidoTexto?: string;
  coordenadas?: { latitud: number; longitud: number };
  nombreParada?: string;
}

export const ParadaInfoBar: React.FC<ParadaInfoBarProps> = ({
  distancia = "120 m",
  sentidoTexto = "hacia el centro",
  coordenadas = { latitud: -31.7333, longitud: -60.5241 },
  nombreParada = "Alameda y Urquiza",
}) => {
  const { paleta } = useThemeContext();

  const handleComoLlegar = async () => {
    const { latitud, longitud } = coordenadas;
    const etiqueta = encodeURIComponent(nombreParada);

    const url = Platform.select({
      ios: `maps:0,0?q=${etiqueta}@${latitud},${longitud}`,
      android: `geo:0,0?q=${latitud},${longitud}(${etiqueta})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`,
    });

    try {
      const soportado = await Linking.canOpenURL(url!);
      if (soportado) {
        await Linking.openURL(url!);
      } else {
        await Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`,
        );
      }
    } catch {
      Alert.alert(
        "Navegación",
        `Caminar hasta ${nombreParada} (${distancia}). Coordenadas: ${latitud}, ${longitud}`,
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Pill con flecha de orientación y distancia */}
      <View style={styles.pill}>
        <Ionicons name="arrow-up-outline" size={15} color="#0284c7" style={styles.arrowIcon} />
        <Text style={styles.pillText}>
          {distancia} · {sentidoTexto}
        </Text>
      </View>

      {/* Enlace Cómo llegar */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleComoLlegar}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.comoLlegar, { color: paleta.textoMedio }]}>
          Cómo llegar
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(108, 180, 245, 0.28)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  arrowIcon: {
    transform: [{ rotate: "-45deg" }],
  },
  pillText: {
    color: "#0369a1",
    fontSize: 13,
    fontWeight: "700",
  },
  comoLlegar: {
    fontSize: 13,
    fontWeight: "600",
  },
});
