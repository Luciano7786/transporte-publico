import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";
import { formatearTiempoTranscurrido } from "../../services/reportes.service";
import type { ReporteDeDemora } from "../../types";

interface DemoraReporteCardProps {
  reporte: ReporteDeDemora;
  onConfirmar?: (reporteId: string) => void;
  confirmadoPorMi?: boolean;
}

export const DemoraReporteCard: React.FC<DemoraReporteCardProps> = ({
  reporte,
  onConfirmar,
  confirmadoPorMi = false,
}) => {
  const { paleta } = useThemeContext();
  const estiloAviso = paleta.gravedadAviso.desvio;

  const tiempo = formatearTiempoTranscurrido(reporte.fechaHora);
  const lineaTexto = reporte.lineaId.replace("lin-0", "L").replace("lin-", "L");

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
        <Text style={[styles.mensajeTexto, { color: paleta.textoAlto }]}>
          {reporte.confirmaciones}{" "}
          {reporte.confirmaciones === 1 ? "pasajero reportó" : "pasajeros reportaron"}{" "}
          demora en la {lineaTexto} {tiempo}
        </Text>
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
          {confirmadoPorMi ? "✓ Demora confirmada" : "Confirmar"}
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
  mensajeTexto: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  confirmarBoton: {
    marginTop: 8,
    marginLeft: 26,
    alignSelf: "flex-start",
  },
  confirmarTexto: {
    fontSize: 14,
    fontWeight: "700",
  },
});
