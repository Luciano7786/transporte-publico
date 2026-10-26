import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";
import { formatearRangoFechas } from "../../services/avisos.service";
import type { Aviso, Linea } from "../../types";

interface AvisoCardProps {
  aviso: Aviso;
  lineas: Linea[];
  onPressVideo?: (videoUrl: string) => void;
  onPressVerMapa?: (lineaId?: string) => void;
}

export const AvisoCard: React.FC<AvisoCardProps> = ({
  aviso,
  lineas,
  onPressVideo,
  onPressVerMapa,
}) => {
  const { paleta } = useThemeContext();

  const estiloGravedad = paleta.gravedadAviso[aviso.gravedad];
  const rangoFechas = formatearRangoFechas(aviso.desde, aviso.hasta);

  const etiquetaGravedad =
    aviso.gravedad === "desvio"
      ? "Desvío"
      : aviso.gravedad === "informativo"
        ? "Informativo"
        : "Suspensión";

  // Obtenemos los objetos de línea afectados para pintar sus números y colores exactos
  const lineasAfectadas = aviso.lineaIds.map((id) => {
    const lObj = lineas.find((l) => l.id === id);
    const num = id.replace("lin-0", "").replace("lin-", "");
    return {
      id,
      numero: lObj?.numero ?? num,
      color:
        lObj?.color ??
        (id === "lin-02"
          ? "#7C3AAD"
          : id === "lin-07"
            ? "#0F766E"
            : id === "lin-09"
              ? "#9A3412"
              : id === "lin-14"
                ? "#B45309"
                : paleta.acento),
    };
  });

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: paleta.superficie1,
          borderColor: estiloGravedad.borde,
        },
      ]}
    >
      {/* Encabezado: Etiqueta de gravedad y rango de fechas */}
      <View style={styles.headerRow}>
        <Text style={[styles.gravedadTexto, { color: estiloGravedad.texto }]}>
          {etiquetaGravedad}
        </Text>
        <Text style={[styles.rangoFechas, { color: paleta.textoMedio }]}>
          {rangoFechas}
        </Text>
      </View>

      {/* Título del aviso */}
      <Text style={[styles.titulo, { color: paleta.textoAlto }]}>
        {aviso.titulo}
      </Text>

      {/* Badges de las líneas afectadas */}
      <View style={styles.lineasRow}>
        {lineasAfectadas.map((l) => (
          <View key={l.id} style={[styles.lineaBadge, { backgroundColor: l.color }]}>
            <Text style={styles.lineaBadgeTexto}>{l.numero}</Text>
          </View>
        ))}
      </View>

      {/* Detalle descriptivo */}
      {aviso.detalle ? (
        <Text style={[styles.detalle, { color: paleta.textoMedio }]}>
          {aviso.detalle}
        </Text>
      ) : null}

      {/* Botón de reproducción de Video corto */}
      {aviso.videoUrl ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onPressVideo?.(aviso.videoUrl!)}
          style={[
            styles.videoButton,
            {
              backgroundColor: paleta.superficie2,
              borderColor: paleta.borde,
            },
          ]}
        >
          <Ionicons name="play" size={16} color={paleta.textoAlto} />
          <Text style={[styles.videoButtonTexto, { color: paleta.textoAlto }]}>
            Video · 20 s
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Botón para ver recorrido en el mapa */}
      {aviso.trazadoAlternativo ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            onPressVerMapa?.(
              aviso.lineaIds.includes("lin-07") ? "lin-07" : aviso.lineaIds[0],
            )
          }
          style={[
            styles.mapaButton,
            {
              backgroundColor: paleta.superficie2,
              borderColor: paleta.borde,
            },
          ]}
        >
          <Text style={[styles.mapaButtonTexto, { color: paleta.textoAlto }]}>
            Ver recorrido en el mapa
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  gravedadTexto: {
    fontSize: 15,
    fontWeight: "700",
  },
  rangoFechas: {
    fontSize: 13,
    fontWeight: "500",
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    lineHeight: 24,
  },
  lineasRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  lineaBadge: {
    minWidth: 32,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  lineaBadgeTexto: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  detalle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  videoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
  },
  videoButtonTexto: {
    fontSize: 15,
    fontWeight: "700",
  },
  mapaButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
  },
  mapaButtonTexto: {
    fontSize: 14,
    fontWeight: "700",
  },
});
