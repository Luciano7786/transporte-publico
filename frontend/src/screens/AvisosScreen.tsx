import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvisoCard } from "../components/avisos/AvisoCard";
import { AvisosHeader } from "../components/avisos/AvisosHeader";
import { FiltrosAvisos } from "../components/avisos/FiltrosAvisos";
import { VideoModal } from "../components/avisos/VideoModal";
import { AuthContext } from "../contexts/AuthContext";
import { useThemeContext } from "../hooks/use-theme-context";
import {
  FiltroAvisos,
  filtrarAvisos,
  formatearTiempoActualizacion,
  obtenerAvisos,
  obtenerUltimaActualizacionAvisos,
} from "../services/avisos.service";
import { obtenerLineas } from "../services/lineas.service";
import { notificarNuevosAvisosEnLineasFavoritas } from "../services/notificaciones.service";
import type { Aviso, Linea } from "../types";

export function AvisosScreen() {
  const navigation = useNavigation<any>();
  const { paleta } = useThemeContext();
  const auth = useContext(AuthContext);

  const [todosAvisos, setTodosAvisos] = useState<Aviso[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [filtroActual, setFiltroActual] = useState<FiltroAvisos>("vigentes");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [ultimaActualizacionIso, setUltimaActualizacionIso] = useState<string>(
    () => new Date().toISOString(),
  );
  const [minutosTranscurridos, setMinutosTranscurridos] = useState<number>(0);
  const [mostrandoCacheOffline, setMostrandoCacheOffline] =
    useState<boolean>(false);

  // Estado del modal de video
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoUrlActual, setVideoUrlActual] = useState<string | null>(null);

  const cargarDatos = async (esRefresco = false) => {
    try {
      if (!esRefresco) setCargando(true);
      setErrorCarga(null);

      const [resAvisos, resLineas, fechaGuardada] = await Promise.allSettled([
        obtenerAvisos("todos"),
        obtenerLineas(),
        obtenerUltimaActualizacionAvisos(),
      ]);

      if (resAvisos.status === "fulfilled") {
        setTodosAvisos(resAvisos.value.datos);
        const esCache = Boolean(resAvisos.value.desdeCache);
        setMostrandoCacheOffline(esCache);

        notificarNuevosAvisosEnLineasFavoritas(
          resAvisos.value.datos,
          auth?.lineasFavoritas ?? ["lin-05", "lin-14"],
          auth?.usuario?.avisosActivos ?? true,
        ).catch(() => {});

        if (!esCache) {
          setUltimaActualizacionIso(new Date().toISOString());
          setMinutosTranscurridos(0);
        } else if (
          fechaGuardada.status === "fulfilled" &&
          fechaGuardada.value
        ) {
          setUltimaActualizacionIso(fechaGuardada.value);
          const diffMin = Math.max(
            0,
            Math.floor(
              (Date.now() - new Date(fechaGuardada.value).getTime()) / 60000,
            ),
          );
          setMinutosTranscurridos(diffMin);
        }
      } else {
        setErrorCarga(
          resAvisos.reason?.message ||
            "No se pudieron obtener los avisos en este momento.",
        );
      }
      if (resLineas.status === "fulfilled") {
        setLineas(resLineas.value.datos);
      }
    } catch (err: any) {
      setErrorCarga(err?.message || "No se pudieron cargar los avisos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos(false);
  }, []);

  // Recalcula cada 30 segundos cuántos minutos pasaron desde la última actualización real
  useEffect(() => {
    const calcularMinutos = () => {
      const diffMs = Date.now() - new Date(ultimaActualizacionIso).getTime();
      setMinutosTranscurridos(Math.max(0, Math.floor(diffMs / 60000)));
    };
    calcularMinutos();
    const timer = setInterval(calcularMinutos, 30000);
    return () => clearInterval(timer);
  }, [ultimaActualizacionIso]);

  const onRefresh = async () => {
    setRefrescando(true);
    await cargarDatos(true);
    setRefrescando(false);
  };

  // Filtrado de avisos según el chip activo y las líneas favoritas del pasajero
  const avisosFiltrados = filtrarAvisos(
    todosAvisos,
    filtroActual,
    auth?.lineasFavoritas ?? ["lin-05", "lin-14"],
  );

  const handleOpenVideo = (videoUrl: string) => {
    setVideoUrlActual(videoUrl);
    setVideoModalVisible(true);
  };

  const handleVerRecorridoMapa = (lineaId?: string) => {
    navigation.navigate("LineaDetalle", { lineaId: lineaId ?? "lin-07" });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: paleta.fondoApp }]}
    >
      {/* 1. Header */}
      <AvisosHeader titulo="Avisos" />

      {/* 2. Chips de Filtrado */}
      <FiltrosAvisos
        filtroActual={filtroActual}
        onChangeFiltro={setFiltroActual}
      />

      {/* Aviso de información guardada cuando no hay señal */}
      {mostrandoCacheOffline ? (
        <View
          style={[
            styles.offlineBanner,
            {
              backgroundColor: paleta.superficie2,
              borderColor: paleta.borde,
            },
          ]}
        >
          <Ionicons
            name="cloud-offline-outline"
            size={16}
            color={paleta.advertencia}
          />
          <Text style={[styles.offlineBannerTexto, { color: paleta.textoMedio }]}>
            Mostrando avisos guardados en el teléfono (sin conexión)
          </Text>
        </View>
      ) : null}

      {/* 3. Listado de Avisos */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={onRefresh}
            tintColor={paleta.acento}
          />
        }
      >
        {cargando && todosAvisos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={paleta.acento} />
            <Text style={[styles.emptyTexto, { color: paleta.textoMedio, marginTop: 10 }]}>
              Consultando avisos de la Dirección de Transporte...
            </Text>
          </View>
        ) : errorCarga && todosAvisos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={36}
              color={paleta.advertencia}
            />
            <Text style={[styles.emptyTexto, { color: paleta.textoMedio, marginTop: 8 }]}>
              {errorCarga}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => cargarDatos(false)}
              style={[
                styles.botonReintentar,
                { backgroundColor: paleta.acento },
              ]}
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
        ) : avisosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTexto, { color: paleta.textoMedio }]}>
              {filtroActual === "vencidos"
                ? "No hay avisos vencidos en este momento."
                : filtroActual === "mis_lineas"
                  ? "Tus líneas favoritas no tienen avisos hoy."
                  : "No hay avisos vigentes."}
            </Text>
          </View>
        ) : (
          avisosFiltrados.map((aviso) => (
            <AvisoCard
              key={aviso.id}
              aviso={aviso}
              lineas={lineas}
              onPressVideo={handleOpenVideo}
              onPressVerMapa={handleVerRecorridoMapa}
            />
          ))
        )}

        {/* 4. Pie de estado de actualización con antigüedad real */}
        <Text style={[styles.actualizadoTexto, { color: paleta.textoBajo }]}>
          {formatearTiempoActualizacion(
            minutosTranscurridos,
            mostrandoCacheOffline,
          )}
        </Text>
      </ScrollView>

      {/* 5. Modal de reproducción de video */}
      <VideoModal
        visible={videoModalVisible}
        videoUrl={videoUrlActual}
        onClose={() => setVideoModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTexto: {
    fontSize: 15,
    textAlign: "center",
  },
  botonReintentar: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  botonReintentarTexto: {
    fontSize: 14,
    fontWeight: "700",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  offlineBannerTexto: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  actualizadoTexto: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
  },
});
