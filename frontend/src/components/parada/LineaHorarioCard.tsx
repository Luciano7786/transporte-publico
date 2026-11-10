import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";

interface LineaHorarioCardProps {
  numero: string;
  destino: string;
  color: string;
  proximo: string;
  etiquetaMinutos?: string;
  siguientes?: string[];
  todosLosHorarios?: string[];
  finalizoServicio?: boolean;
  primerHorarioManana?: string;
  ultimoHorarioHoy?: string;
  recordatorioActivo?: boolean;
  onPressRecordatorio?: (numeroLinea: string, hora: string) => void;
}

export const LineaHorarioCard: React.FC<LineaHorarioCardProps> = ({
  numero,
  destino,
  color,
  proximo,
  etiquetaMinutos,
  siguientes = [],
  todosLosHorarios = [],
  finalizoServicio = false,
  primerHorarioManana,
  ultimoHorarioHoy,
  recordatorioActivo = false,
  onPressRecordatorio,
}) => {
  const { paleta } = useThemeContext();
  const [verTablaCompleta, setVerTablaCompleta] = useState(false);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: paleta.superficie1,
          borderColor: paleta.borde,
        },
      ]}
    >
      {/* Si finalizó el servicio: cabecera completa con el color de la línea */}
      {finalizoServicio ? (
        <>
          <View style={[styles.bannerLineaFin, { backgroundColor: color }]}>
            <Text style={styles.bannerLineaNumero}>{numero}</Text>
          </View>

          <View style={styles.finServicioContainer}>
            <Text style={[styles.finServicioTitulo, { color: paleta.textoAlto }]}>
              No hay más servicio hasta mañana{"\n"}
              a las {primerHorarioManana ?? (numero === "5" ? "05:20" : "05:35")}
            </Text>
            <Text
              style={[styles.ultimoHorarioTexto, { color: paleta.textoMedio }]}
            >
              Último horario de hoy:{" "}
              {ultimoHorarioHoy ?? (numero === "5" ? "23:22" : "23:51")}
            </Text>

            {todosLosHorarios.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setVerTablaCompleta((prev) => !prev)}
                style={styles.toggleTablaBtn}
              >
                <Text style={[styles.toggleTablaTexto, { color: paleta.acento }]}>
                  {verTablaCompleta
                    ? "Ocultar tabla completa"
                    : `Ver todos los horarios (${todosLosHorarios.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <View style={styles.paddingContenido}>
          {/* Encabezado: Badge de línea y destino */}
          <View style={styles.headerRow}>
            <View style={[styles.badge, { backgroundColor: color }]}>
              <Text style={styles.badgeTexto}>{numero}</Text>
            </View>
            <Text
              style={[styles.destinoTexto, { color: paleta.textoAlto }]}
              numberOfLines={1}
            >
              {destino}
            </Text>
          </View>

          {/* Horario Principal */}
          <View style={styles.horarioPrincipalRow}>
            <Text
              style={[styles.horarioPrincipal, { color: paleta.textoAlto }]}
            >
              {proximo}
            </Text>
            {etiquetaMinutos ? (
              <Text style={[styles.minutosTexto, { color: paleta.textoMedio }]}>
                {etiquetaMinutos}
              </Text>
            ) : null}
          </View>

          {/* Horarios siguientes */}
          {siguientes.length > 0 ? (
            <View style={styles.siguientesRow}>
              {siguientes.map((hora, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.horarioSiguiente,
                    { color: paleta.textoMedio },
                  ]}
                >
                  {hora}
                </Text>
              ))}
            </View>
          ) : null}

          {/* Acciones inferiores: Recordatorio 10 min antes y Ver tabla completa */}
          <View
            style={[
              styles.accionesRow,
              { borderTopColor: paleta.borde },
            ]}
          >
            {onPressRecordatorio ? (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => onPressRecordatorio(numero, proximo)}
                style={[
                  styles.botonRecordatorio,
                  recordatorioActivo
                    ? {
                        backgroundColor: "rgba(2, 132, 199, 0.15)",
                        borderColor: "#0284c7",
                      }
                    : {
                        backgroundColor: paleta.fondoApp,
                        borderColor: paleta.borde,
                      },
                ]}
              >
                <Ionicons
                  name={recordatorioActivo ? "notifications" : "notifications-outline"}
                  size={15}
                  color={recordatorioActivo ? "#0284c7" : paleta.textoMedio}
                />
                <Text
                  style={[
                    styles.recordatorioTexto,
                    {
                      color: recordatorioActivo ? "#0284c7" : paleta.textoAlto,
                    },
                  ]}
                >
                  {recordatorioActivo
                    ? `Recordatorio activo (${proximo})`
                    : `Avisame 10 min antes (${proximo})`}
                </Text>
              </TouchableOpacity>
            ) : null}

            {todosLosHorarios.length > 0 ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setVerTablaCompleta((prev) => !prev)}
                style={styles.toggleTablaBtn}
              >
                <Text style={[styles.toggleTablaTexto, { color: paleta.acento }]}>
                  {verTablaCompleta ? "Ocultar tabla" : "Tabla completa"}
                </Text>
                <Ionicons
                  name={verTablaCompleta ? "chevron-up" : "chevron-down"}
                  size={15}
                  color={paleta.acento}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      {/* Desplegable con todos los horarios del día seleccionado */}
      {verTablaCompleta && todosLosHorarios.length > 0 ? (
        <View
          style={[
            styles.tablaCompletaContainer,
            {
              backgroundColor: paleta.fondoApp,
              borderTopColor: paleta.borde,
            },
          ]}
        >
          <View style={styles.grillaHorarios}>
            {todosLosHorarios.map((hora, idx) => {
              const esProximo = !finalizoServicio && hora === proximo;
              return (
                <View
                  key={`${hora}-${idx}`}
                  style={[
                    styles.chipHora,
                    esProximo
                      ? { backgroundColor: color }
                      : {
                          backgroundColor: paleta.superficie1,
                          borderColor: paleta.borde,
                          borderWidth: 1,
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipHoraTexto,
                      { color: esProximo ? "#ffffff" : paleta.textoAlto },
                    ]}
                  >
                    {hora}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  paddingContenido: {
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  badge: {
    width: 36,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTexto: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  destinoTexto: {
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 10,
    flex: 1,
  },
  horarioPrincipalRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
  },
  horarioPrincipal: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  minutosTexto: {
    fontSize: 14,
    fontWeight: "500",
  },
  siguientesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  horarioSiguiente: {
    fontSize: 16,
    fontWeight: "400",
  },
  bannerLineaFin: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerLineaNumero: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  finServicioContainer: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  finServicioTitulo: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
  },
  ultimoHorarioTexto: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  accionesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  botonRecordatorio: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  recordatorioTexto: {
    fontSize: 12,
    fontWeight: "600",
  },
  toggleTablaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
  },
  toggleTablaTexto: {
    fontSize: 13,
    fontWeight: "600",
  },
  tablaCompletaContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  grillaHorarios: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipHora: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  chipHoraTexto: {
    fontSize: 13,
    fontWeight: "600",
  },
});
