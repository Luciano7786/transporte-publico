import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeContext } from "../hooks/use-theme-context";
import { obtenerAvisos, obtenerLineas } from "../services/lineas.service";
import type { Aviso, Linea } from "../types";

export function LinesScreen() {
  const navigation = useNavigation<any>();
  const { paleta } = useThemeContext();

  const [lineas, setLineas] = useState<Linea[]>([]);
  const [lineasConDesvio, setLineasConDesvio] = useState<string[]>([]);

  useEffect(() => {
    let activo = true;

    async function cargarLineas() {
      try {
        const [resLineas, resAvisos] = await Promise.allSettled([
          obtenerLineas(),
          obtenerAvisos(),
        ]);

        if (activo) {
          if (resLineas.status === "fulfilled") {
            setLineas(resLineas.value.datos);
          }

          if (resAvisos.status === "fulfilled") {
            const ahora = new Date().toISOString();
            const desviosVigentes = resAvisos.value.datos.filter(
              (a) =>
                a.gravedad === "desvio" &&
                a.desde <= ahora &&
                (!a.hasta || a.hasta >= ahora),
            );

            const idsAfectadas = desviosVigentes.flatMap((d) => d.lineaIds);
            setLineasConDesvio(idsAfectadas);
          }
        }
      } catch (err) {
        console.warn("Error cargando líneas:", err);
      }
    }

    cargarLineas();

    return () => {
      activo = false;
    };
  }, []);

  const handleSelectLinea = (lineaId: string) => {
    navigation.navigate("LineaDetalle", { lineaId });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: paleta.fondoApp }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.titulo, { color: paleta.textoAlto }]}>Líneas</Text>
        <Text style={[styles.subtitulo, { color: paleta.textoBajo }]}>
          14 líneas urbanas de Paraná
        </Text>
      </View>

      {/* Listado de Líneas */}
      <FlatList
        data={lineas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const tieneDesvio = lineasConDesvio.includes(item.id);

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleSelectLinea(item.id)}
              style={[
                styles.lineaCard,
                {
                  backgroundColor: paleta.superficie1,
                  borderColor: paleta.borde,
                },
              ]}
            >
              {/* Badge con número de línea */}
              <View
                style={[styles.lineaBadge, { backgroundColor: item.color }]}
              >
                <Text style={styles.lineaNumero}>{item.numero}</Text>
              </View>

              {/* Información central */}
              <View style={styles.infoCentral}>
                <Text
                  style={[styles.nombreLinea, { color: paleta.textoAlto }]}
                  numberOfLines={1}
                >
                  {item.nombre}
                </Text>
                <Text
                  style={[styles.empresaLinea, { color: paleta.textoMedio }]}
                  numberOfLines={1}
                >
                  {item.empresa}
                </Text>
              </View>

              {/* Insignia de Estado (Desvío o Normal) */}
              <View
                style={[
                  styles.estadoBadge,
                  tieneDesvio
                    ? {
                        backgroundColor: paleta.gravedadAviso.desvio.fondo,
                        borderColor: paleta.gravedadAviso.desvio.borde,
                      }
                    : {
                        backgroundColor: "rgba(76, 200, 132, 0.15)",
                        borderColor: "rgba(76, 200, 132, 0.45)",
                      },
                ]}
              >
                <Text
                  style={[
                    styles.estadoTexto,
                    {
                      color: tieneDesvio ? paleta.advertencia : paleta.exito,
                    },
                  ]}
                >
                  {tieneDesvio ? "Desvío" : "Normal"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitulo: {
    fontSize: 13,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 10,
  },
  lineaCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  lineaBadge: {
    minWidth: 42,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  lineaNumero: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  infoCentral: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  nombreLinea: {
    fontSize: 16,
    fontWeight: "700",
  },
  empresaLinea: {
    fontSize: 12,
    marginTop: 2,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  estadoTexto: {
    fontSize: 12,
    fontWeight: "700",
  },
});
