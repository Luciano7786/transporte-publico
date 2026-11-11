import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeContext } from "../hooks/use-theme-context";
import { obtenerAvisos, obtenerLineas } from "../services/lineas.service";
import type { Linea } from "../types";

export function LinesScreen() {
  const navigation = useNavigation<any>();
  const { paleta } = useThemeContext();

  const [lineas, setLineas] = useState<Linea[]>([]);
  const [lineasConDesvio, setLineasConDesvio] = useState<string[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [refrescando, setRefrescando] = useState<boolean>(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const cargarLineas = async (esRefresco = false) => {
    try {
      if (esRefresco) {
        setRefrescando(true);
      } else {
        setCargando(true);
      }
      setErrorCarga(null);

      const [resLineas, resAvisos] = await Promise.allSettled([
        obtenerLineas(),
        obtenerAvisos(),
      ]);

      if (resLineas.status === "fulfilled") {
        setLineas(resLineas.value.datos);
      } else {
        setErrorCarga(
          resLineas.reason?.message ||
            "No se pudieron cargar las líneas urbanas.",
        );
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
    } catch (err: any) {
      setErrorCarga(err?.message || "No se pudieron cargar las líneas.");
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useEffect(() => {
    cargarLineas(false);
  }, []);

  const handleSelectLinea = (lineaId: string) => {
    navigation.navigate("LineaDetalle", { lineaId });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: paleta.fondoApp }]}
    >
      <View style={styles.header}>
        <Text style={[styles.titulo, { color: paleta.textoAlto }]}>Líneas</Text>
        <Text style={[styles.subtitulo, { color: paleta.textoBajo }]}>
          14 líneas urbanas de Paraná
        </Text>
      </View>

      {cargando && lineas.length === 0 ? (
        <View style={styles.estadoContainer}>
          <ActivityIndicator size="large" color={paleta.acento} />
          <Text style={[styles.estadoMensaje, { color: paleta.textoMedio }]}>
            Cargando líneas urbanas...
          </Text>
        </View>
      ) : errorCarga && lineas.length === 0 ? (
        <View style={styles.estadoContainer}>
          <Ionicons
            name="cloud-offline-outline"
            size={38}
            color={paleta.advertencia}
          />
          <Text style={[styles.estadoMensaje, { color: paleta.textoMedio }]}>
            {errorCarga}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => cargarLineas(false)}
            style={[styles.botonReintentar, { backgroundColor: paleta.acento }]}
          >
            <Text
              style={[
                styles.botonReintentarTexto,
                { color: paleta.textoSobreAcento },
              ]}
            >
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={lineas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => cargarLineas(true)}
              tintColor={paleta.acento}
            />
          }
          ListEmptyComponent={
            <View style={styles.estadoContainer}>
              <Text style={[styles.estadoMensaje, { color: paleta.textoMedio }]}>
                No hay líneas disponibles en este momento.
              </Text>
            </View>
          }
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
              <View
                style={[styles.lineaBadge, { backgroundColor: item.color }]}
              >
                <Text style={styles.lineaNumero}>{item.numero}</Text>
              </View>

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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  estadoContainer: {
    flex: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  estadoMensaje: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 21,
  },
  botonReintentar: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  botonReintentarTexto: {
    fontSize: 14,
    fontWeight: "700",
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
