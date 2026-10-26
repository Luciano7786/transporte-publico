import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";

interface LineaHorarioCardProps {
  numero: string;
  destino: string;
  color: string;
  proximo: string;
  etiquetaMinutos?: string;
  siguientes?: string[];
  finalizoServicio?: boolean;
  primerHorarioManana?: string;
  ultimoHorarioHoy?: string;
}

export const LineaHorarioCard: React.FC<LineaHorarioCardProps> = ({
  numero,
  destino,
  color,
  proximo,
  etiquetaMinutos,
  siguientes = [],
  finalizoServicio = false,
  primerHorarioManana,
  ultimoHorarioHoy,
}) => {
  const { paleta } = useThemeContext();

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
              a las {primerHorarioManana ?? (numero === "5" ? "5:20" : "5:35")}
            </Text>
            <Text
              style={[styles.ultimoHorarioTexto, { color: paleta.textoMedio }]}
            >
              Último horario de hoy:{" "}
              {ultimoHorarioHoy ?? (numero === "5" ? "23:22" : "23:51")}
            </Text>
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
        </View>
      )}
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
});
