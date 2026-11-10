import React, { useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, UrlTile } from "react-native-maps";
import { useThemeContext } from "../../hooks/use-theme-context";
import type { Coordenadas, Parada } from "../../types";

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#11161b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#11161b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6e7987" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#95a2b3" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e2631" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#141920" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a96a6" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#283341" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#090d11" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d4754" }],
  },
];

interface MapaInicioProps {
  paradas?: Parada[];
  usuarioCoordenadas?: Coordenadas;
  onSelectParada?: (parada: Parada) => void;
}

export const MapaInicio: React.FC<MapaInicioProps> = ({
  paradas = [],
  usuarioCoordenadas,
  onSelectParada,
}) => {
  const { paleta, temaActual } = useThemeContext();
  const mapRef = useRef<MapView>(null);

  // Coordenada del usuario: ubicación GPS real si está disponible, o centro de Paraná
  const usuarioCoords = useMemo(
    () => ({
      latitude: usuarioCoordenadas?.latitud ?? -31.7333,
      longitude: usuarioCoordenadas?.longitud ?? -60.5241,
    }),
    [usuarioCoordenadas?.latitud, usuarioCoordenadas?.longitud],
  );

  const region = useMemo(
    () => ({
      latitude: usuarioCoords.latitude,
      longitude: usuarioCoords.longitude,
      latitudeDelta: 0.014,
      longitudeDelta: 0.014,
    }),
    [usuarioCoords.latitude, usuarioCoords.longitude],
  );

  // Animar la cámara automáticamente cuando cambian las coordenadas
  useEffect(() => {
    mapRef.current?.animateToRegion(region, 500);
  }, [region]);

  // Asigna un color al pin según la parada para que coincida con la imagen de referencia
  const obtenerColorPin = (paradaId: string) => {
    if (paradaId === "par-101") return "#1B6CA8"; // Azul (Línea 5)
    if (paradaId === "par-104") return "#B45309"; // Naranja (Línea 14)
    return "#CBD5E1"; // Gris claro / blanco
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
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={region}
        onMapReady={() => {
          mapRef.current?.animateToRegion(region, 500);
        }}
        customMapStyle={temaActual === "dark" ? DARK_MAP_STYLE : []}
        showsCompass={false}
        showsBuildings={false}
      >
        {/* Capa de teselas OpenStreetMap para garantizar que las calles se vean sin depender de clave de Google */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          zIndex={-1}
        />

        {/* Marcador de ubicación del usuario (punto azul con anillo pulsante) */}
        <Marker
          coordinate={usuarioCoords}
          title="Tu ubicación"
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={true}
        >
          <View collapsable={false} style={styles.userPulseRing}>
            <View collapsable={false} style={styles.userDot} />
          </View>
        </Marker>

        {/* Marcadores de paradas cercanas */}
        {paradas.map((parada) => {
          const colorPin = obtenerColorPin(parada.id);

          return (
            <Marker
              key={parada.id}
              coordinate={{
                latitude: parada.coordenadas.latitud,
                longitude: parada.coordenadas.longitud,
              }}
              title={parada.nombre}
              description={`Líneas: ${parada.lineaIds.join(", ")}`}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={true}
              onPress={() => onSelectParada?.(parada)}
            >
              <View
                collapsable={false}
                style={[
                  styles.stopPin,
                  {
                    backgroundColor: colorPin,
                    borderColor: "#ffffff",
                  },
                ]}
              />
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFill,
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
  stopPin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 3,
    elevation: 6,
  },
});
