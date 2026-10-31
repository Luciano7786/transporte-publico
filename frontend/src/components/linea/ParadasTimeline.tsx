import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";

export type EstadoParadaEnLinea = "normal" | "sin_servicio" | "provisoria";

export interface ItemParadaTimeline {
  id: string;
  nombre: string;
  estado?: EstadoParadaEnLinea;
}

interface ParadasTimelineProps {
  paradas: ItemParadaTimeline[];
  colorLinea: string;
  onSelectParada?: (paradaId: string) => void;
}

export const ParadasTimeline: React.FC<ParadasTimelineProps> = ({
  paradas,
  colorLinea,
  onSelectParada,
}) => {
  const { paleta } = useThemeContext();

  return (
    <View style={styles.container}>
      {paradas.map((item, index) => {
        const esUltima = index === paradas.length - 1;
        const sinServicio = item.estado === "sin_servicio";
        const provisoria = item.estado === "provisoria";

        const colorNodo = sinServicio
          ? paleta.error
          : provisoria
            ? paleta.advertencia
            : colorLinea;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => onSelectParada?.(item.id)}
            style={styles.itemRow}
          >
            {/* Columna con línea vertical y círculo */}
            <View style={styles.timelineColumn}>
              <View
                style={[
                  styles.nodeCircle,
                  {
                    borderColor: colorNodo,
                    backgroundColor: paleta.fondoApp,
                  },
                ]}
              >
                <View
                  style={[
                    styles.nodeInnerDot,
                    {
                      backgroundColor: sinServicio ? paleta.error : colorNodo,
                    },
                  ]}
                />
              </View>

              {!esUltima && (
                <View
                  style={[
                    styles.timelineLine,
                    {
                      backgroundColor: colorLinea,
                    },
                  ]}
                />
              )}
            </View>

            {/* Texto de la parada y su estado */}
            <View style={styles.infoColumn}>
              <View style={styles.nombreRow}>
                <Text
                  style={[
                    styles.nombreParada,
                    {
                      color: sinServicio ? paleta.textoMedio : paleta.textoAlto,
                      textDecorationLine: sinServicio ? "line-through" : "none",
                    },
                  ]}
                >
                  {item.nombre}
                </Text>

                {sinServicio && (
                  <Text style={[styles.estadoTag, { color: paleta.error }]}>
                    · sin servicio
                  </Text>
                )}

                {provisoria && (
                  <Text style={[styles.estadoTag, { color: paleta.advertencia }]}>
                    · parada provisoria
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 52,
  },
  timelineColumn: {
    width: 28,
    alignItems: "center",
  },
  nodeCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  nodeInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineLine: {
    width: 3,
    flex: 1,
    marginVertical: -2,
    zIndex: 1,
  },
  infoColumn: {
    flex: 1,
    marginLeft: 12,
    paddingTop: 1,
  },
  nombreRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  nombreParada: {
    fontSize: 16,
    fontWeight: "700",
  },
  estadoTag: {
    fontSize: 13,
    fontWeight: "500",
  },
});
