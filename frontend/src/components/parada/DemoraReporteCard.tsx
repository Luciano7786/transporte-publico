import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";
import { formatearTiempoTranscurrido } from "../../services/reportes.service";
import type { MotivoDemora, ReporteDeDemora } from "../../types";

interface DemoraReporteCardProps {
  reporte: ReporteDeDemora;
  onConfirmar?: (reporteId: string) => void;
  confirmadoPorMi?: boolean;
}

const ETIQUETA_MOTIVO: Record<MotivoDemora, string> = {
  no_paso: "No pasó",
  paso_lleno: "Pasó lleno y no paró",
  demorado: "Viene demorado",
  unidad_rota: "Unidad rota",
  calle_cortada: "Calle cortada",
};

export const DemoraReporteCard: React.FC<DemoraReporteCardProps> = ({
  reporte,
  onConfirmar,
  confirmadoPorMi = false,
}) => {
  const { paleta } = useThemeContext();
  const estiloAviso = paleta.gravedadAviso.desvio;

  const tiempo = formatearTiempoTranscurrido(reporte.fechaHora);
  const lineaTexto = reporte.lineaId.replace("lin-0", "L").replace("lin-", "L");
  const totalPersonas = Math.max(1, reporte.confirmaciones + 1);
  const motivoLegible = ETIQUETA_MOTIVO[reporte.motivo] ?? "Demora";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: estiloAviso.fondo,
          borderColor: estiloAviso.borde,
        },
      ]}
    >
      <View style={styles.mensajeRow}>
        <Ionicons name="alert-circle" size={18} color={estiloAviso.texto} />
        <View style={styles.textosColumna}>
          <Text style={[styles.mensajeTexto, { color: paleta.textoAlto }]}>
            {totalPersonas}{" "}
            {totalPersonas === 1 ? "pasajero reportó" : "pasajeros reportaron"}:{" "}
            {motivoLegible.toLowerCase()} en la {lineaTexto} ({tiempo})
          </Text>

          {reporte.comentario ? (
            <Text style={[styles.comentarioTexto, { color: paleta.textoMedio }]}>
              "{reporte.comentario}"
            </Text>
          ) : null}

          {reporte.fotoUri ? (
            <Image
              source={{ uri: reporte.fotoUri }}
              style={styles.fotoReporte}
              resizeMode="cover"
            />
          ) : null}
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => !confirmadoPorMi && onConfirmar?.(reporte.id)}
        disabled={confirmadoPorMi}
        style={styles.confirmarBoton}
      >
        <Text
          style={[
            styles.confirmarTexto,
            { color: confirmadoPorMi ? paleta.exito : paleta.textoAlto },
          ]}
        >
          {confirmadoPorMi
            ? "✓ A mí también (confirmado)"
            : "A mí también · Confirmar"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  mensajeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  textosColumna: {
    flex: 1,
  },
  mensajeTexto: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  comentarioTexto: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 4,
    lineHeight: 18,
  },
  fotoReporte: {
    width: "100%",
    height: 130,
    borderRadius: 10,
    marginTop: 8,
  },
  confirmarBoton: {
    marginTop: 10,
    marginLeft: 26,
    alignSelf: "flex-start",
  },
  confirmarTexto: {
    fontSize: 14,
    fontWeight: "700",
  },
});
