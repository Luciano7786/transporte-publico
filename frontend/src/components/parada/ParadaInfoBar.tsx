import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import React, { useEffect, useState } from "react";
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
import {
  calcularRumboGrados,
  COORDENADAS_PARANA_DEFAULT,
  obtenerPuntoCardinal,
} from "../../hooks/use-ubicacion";
import type { Coordenadas } from "../../types";

interface ParadaInfoBarProps {
  distancia?: string;
  sentidoTexto?: string;
  coordenadas?: Coordenadas;
  usuarioCoordenadas?: Coordenadas;
  nombreParada?: string;
}

export const ParadaInfoBar: React.FC<ParadaInfoBarProps> = ({
  distancia = "120 m",
  sentidoTexto = "hacia el centro",
  coordenadas = { latitud: -31.7333, longitud: -60.5241 },
  usuarioCoordenadas = COORDENADAS_PARANA_DEFAULT,
  nombreParada = "Alameda y Urquiza",
}) => {
  const { paleta } = useThemeContext();
  const [rumboDispositivo, setRumboDispositivo] = useState<number>(0);

  useEffect(() => {
    let subMagnetometro: { remove: () => void } | null = null;
    let subHeading: Location.LocationSubscription | null = null;
    let cancelado = false;

    async function iniciarSensoresOrientacion() {
      try {
        if (Platform.OS !== "web") {
          const disponible = await Magnetometer.isAvailableAsync().catch(
            () => false,
          );
          if (disponible && !cancelado) {
            Magnetometer.setUpdateInterval(400);
            subMagnetometro = Magnetometer.addListener((data) => {
              if (cancelado) return;
              const { x, y } = data;
              let angulo = Math.atan2(y, x) * (180 / Math.PI);
              angulo = angulo >= 0 ? angulo : angulo + 360;
              const rumboMag = (360 - angulo + 90) % 360;
              if (!Number.isNaN(rumboMag)) {
                setRumboDispositivo(rumboMag);
              }
            });
            return;
          }
        }

        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted" || cancelado) return;

        subHeading = await Location.watchHeadingAsync((headingData) => {
          if (!cancelado) {
            const rumbo =
              headingData.trueHeading >= 0
                ? headingData.trueHeading
                : headingData.magHeading;
            if (typeof rumbo === "number" && !Number.isNaN(rumbo)) {
              setRumboDispositivo(rumbo);
            }
          }
        });
      } catch {
      }
    }

    iniciarSensoresOrientacion();

    return () => {
      cancelado = true;
      subMagnetometro?.remove();
      subHeading?.remove();
    };
  }, []);

  const rumboParada = calcularRumboGrados(usuarioCoordenadas, coordenadas);
  const rotacionFlecha = Math.round((rumboParada - rumboDispositivo + 360) % 360);
  const puntoCardinal = obtenerPuntoCardinal(rumboParada);

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
      <View style={styles.pill}>
        <Ionicons
          name="arrow-up-outline"
          size={15}
          color="#0284c7"
          style={{ transform: [{ rotate: `${rotacionFlecha}deg` }] }}
        />
        <Text style={styles.pillText}>
          {distancia} ({puntoCardinal}) · {sentidoTexto}
        </Text>
      </View>

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
