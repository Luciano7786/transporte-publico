import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { useThemeContext } from "../../hooks/use-theme-context";
import type { Coordenadas } from "../../types";

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
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#090d11" }],
  },
];

interface MapaRecorridoProps {
  trazadoNormal: Coordenadas[];
  trazadoAlternativo?: Coordenadas[] | null;
  colorLinea: string;
  totalParadas?: number;
}

export const MapaRecorrido: React.FC<MapaRecorridoProps> = ({
  trazadoNormal,
  trazadoAlternativo,
  colorLinea,
  totalParadas = 14,
}) => {
  const { paleta, temaActual } = useThemeContext();

  const coordsNormales = trazadoNormal.map((c) => ({
    latitude: c.latitud,
    longitude: c.longitud,
  }));

  const coordsAlternativas = (trazadoAlternativo ?? []).map((c) => ({
    latitude: c.latitud,
    longitude: c.longitud,
  }));

  const regionInicial = {
    latitude: -31.7345,
    longitude: -60.523,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <View style={[styles.mapWebFallback, { backgroundColor: paleta.superficie2 }]}>
          <Text style={[styles.fallbackText, { color: paleta.textoMedio }]}>
            Mapa del recorrido de la línea
          </Text>
        </View>
        <Text style={[styles.leyenda, { color: paleta.textoMedio }]}>
          {trazadoAlternativo ? "Trazado alternativo punteado · " : ""}
          {totalParadas} paradas en este sentido
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.mapWrapper, { borderColor: paleta.borde }]}>
      <MapView
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={regionInicial}
          customMapStyle={temaActual === "dark" ? DARK_MAP_STYLE : []}
          showsCompass={false}
          showsBuildings={false}
        >
          {/* Trazado normal de la línea */}
          {coordsNormales.length > 1 ? (
            <Polyline
              coordinates={coordsNormales}
              strokeColor={colorLinea}
              strokeWidth={4}
            />
          ) : null}

          {/* Trazado alternativo por desvío (línea punteada ámbar) */}
          {coordsAlternativas.length > 1 ? (
            <Polyline
              coordinates={coordsAlternativas}
              strokeColor="#f5a524"
              strokeWidth={4}
              lineDashPattern={[6, 6]}
            />
          ) : null}

          {/* Marcadores de inicio y fin */}
          {coordsNormales.length > 0 ? (
            <Marker
              coordinate={coordsNormales[0]}
              title="Inicio"
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View collapsable={false} style={[styles.pin, { backgroundColor: colorLinea }]} />
            </Marker>
          ) : null}
          {coordsNormales.length > 1 ? (
            <Marker
              coordinate={coordsNormales[coordsNormales.length - 1]}
              title="Destino"
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View collapsable={false} style={[styles.pin, { backgroundColor: colorLinea }]} />
            </Marker>
          ) : null}
        </MapView>
      </View>

      {/* Leyenda debajo del mapa */}
      <Text style={[styles.leyenda, { color: paleta.textoMedio }]}>
        {trazadoAlternativo ? "Trazado alternativo punteado · " : ""}
        {totalParadas} paradas en este sentido
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  mapWrapper: {
    height: 190,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  mapWebFallback: {
    height: 190,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    fontSize: 14,
  },
  leyenda: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 10,
  },
  pin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
});
