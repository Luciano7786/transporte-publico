import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";
import type { Coordenadas, Parada } from "../../types";
import { MapaLeaflet, type PuntoMapa } from "../mapa/MapaLeaflet";

interface MapaInicioProps {
  paradas?: Parada[];
  usuarioCoordenadas?: Coordenadas;
  onSelectParada?: (parada: Parada) => void;
}

// Asigna un color al pin según la parada para que coincida con la imagen de referencia
const obtenerColorPin = (paradaId: string) => {
  if (paradaId === "par-101") return "#1B6CA8"; // Azul (Línea 5)
  if (paradaId === "par-104") return "#B45309"; // Naranja (Línea 14)
  return "#CBD5E1"; // Gris claro / blanco
};

export const MapaInicio: React.FC<MapaInicioProps> = ({
  paradas = [],
  usuarioCoordenadas,
  onSelectParada,
}) => {
  const { paleta, temaActual } = useThemeContext();

  // Ubicación GPS real si está disponible, o centro de Paraná
  const usuario = useMemo<Coordenadas>(
    () => ({
      latitud: usuarioCoordenadas?.latitud ?? -31.7333,
      longitud: usuarioCoordenadas?.longitud ?? -60.5241,
    }),
    [usuarioCoordenadas?.latitud, usuarioCoordenadas?.longitud],
  );

  const puntos = useMemo<PuntoMapa[]>(
    () => [
      {
        id: "__usuario__",
        latitud: usuario.latitud,
        longitud: usuario.longitud,
        titulo: "Tu ubicación",
        tipo: "usuario",
      },
      ...paradas.map<PuntoMapa>((p) => ({
        id: p.id,
        latitud: p.coordenadas.latitud,
        longitud: p.coordenadas.longitud,
        titulo: p.nombre,
        color: obtenerColorPin(p.id),
        tipo: "parada",
      })),
    ],
    [usuario, paradas],
  );

  const alTocarPunto = (id: string) => {
    const parada = paradas.find((p) => p.id === id);
    if (parada) onSelectParada?.(parada);
  };

  if (Platform.OS === "web") {
    return (
      <View style={[styles.mapWebFallback, { backgroundColor: paleta.superficie2 }]}>
        <View style={styles.userPulseRing}>
          <View style={styles.userDot} />
        </View>
        <Text style={[styles.fallbackText, { color: paleta.textoMedio }]}>
          Vista de mapa interactivo (Paraná)
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapaLeaflet
        centro={usuario}
        zoom={15}
        puntos={puntos}
        oscuro={temaActual === "dark"}
        onPressPunto={alTocarPunto}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  mapWebFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    marginTop: 12,
    fontSize: 14,
  },
  userPulseRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(56, 138, 224, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2563eb",
    borderWidth: 2.5,
    borderColor: "#ffffff",
  },
});
