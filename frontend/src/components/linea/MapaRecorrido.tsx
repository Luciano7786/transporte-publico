import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";
import type { Coordenadas } from "../../types";
import { MapaLeaflet, type LineaMapa, type PuntoMapa } from "../mapa/MapaLeaflet";

interface MapaRecorridoProps {
  trazadoNormal: Coordenadas[];
  trazadoAlternativo?: Coordenadas[] | null;
  colorLinea: string;
  totalParadas?: number;
}

const CENTRO_DEFAULT: Coordenadas = { latitud: -31.7345, longitud: -60.523 };

export const MapaRecorrido: React.FC<MapaRecorridoProps> = ({
  trazadoNormal,
  trazadoAlternativo,
  colorLinea,
  totalParadas = 14,
}) => {
  const { paleta, temaActual } = useThemeContext();

  const lineas = useMemo<LineaMapa[]>(() => {
    const resultado: LineaMapa[] = [];
    if (trazadoNormal.length > 1) {
      resultado.push({ puntos: trazadoNormal, color: colorLinea });
    }
    if (trazadoAlternativo && trazadoAlternativo.length > 1) {
      resultado.push({ puntos: trazadoAlternativo, color: "#f5a524", punteada: true });
    }
    return resultado;
  }, [trazadoNormal, trazadoAlternativo, colorLinea]);

  const puntos = useMemo<PuntoMapa[]>(() => {
    const resultado: PuntoMapa[] = [];
    if (trazadoNormal.length > 0) {
      resultado.push({
        id: "inicio",
        ...trazadoNormal[0],
        titulo: "Inicio",
        color: colorLinea,
        tipo: "parada",
      });
    }
    if (trazadoNormal.length > 1) {
      resultado.push({
        id: "destino",
        ...trazadoNormal[trazadoNormal.length - 1],
        titulo: "Destino",
        color: colorLinea,
        tipo: "parada",
      });
    }
    return resultado;
  }, [trazadoNormal, colorLinea]);

  const centro = useMemo<Coordenadas>(() => {
    if (trazadoNormal.length === 0) return CENTRO_DEFAULT;
    const lat = trazadoNormal.reduce((s, c) => s + c.latitud, 0) / trazadoNormal.length;
    const lon = trazadoNormal.reduce((s, c) => s + c.longitud, 0) / trazadoNormal.length;
    return { latitud: lat, longitud: lon };
  }, [trazadoNormal]);

  const leyenda = (
    <Text style={[styles.leyenda, { color: paleta.textoMedio }]}>
      {trazadoAlternativo ? "Trazado alternativo punteado · " : ""}
      {totalParadas} paradas en este sentido
    </Text>
  );

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <View style={[styles.mapWebFallback, { backgroundColor: paleta.superficie2 }]}>
          <Text style={[styles.fallbackText, { color: paleta.textoMedio }]}>
            Mapa del recorrido de la línea
          </Text>
        </View>
        {leyenda}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.mapWrapper, { borderColor: paleta.borde }]}>
        <MapaLeaflet
          centro={centro}
          zoom={14}
          puntos={puntos}
          lineas={lineas}
          oscuro={temaActual === "dark"}
        />
      </View>
      {leyenda}
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
});
