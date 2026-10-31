import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvisoCard } from "../components/avisos/AvisoCard";
import { AvisosHeader } from "../components/avisos/AvisosHeader";
import { FiltrosAvisos } from "../components/avisos/FiltrosAvisos";
import { VideoModal } from "../components/avisos/VideoModal";
import { useThemeContext } from "../hooks/use-theme-context";
import {
  FiltroAvisos,
  filtrarAvisos,
  formatearTiempoActualizacion,
  obtenerAvisos,
} from "../services/avisos.service";
import { obtenerLineas } from "../services/lineas.service";
import type { Aviso, Linea } from "../types";

export function AvisosScreen() {
  const navigation = useNavigation<any>();
  const { paleta } = useThemeContext();

  const [todosAvisos, setTodosAvisos] = useState<Aviso[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [filtroActual, setFiltroActual] = useState<FiltroAvisos>("vigentes");
  const [refrescando, setRefrescando] = useState(false);

  // Estado del modal de video
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoUrlActual, setVideoUrlActual] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      const [resAvisos, resLineas] = await Promise.allSettled([
        obtenerAvisos(),
        obtenerLineas(),
      ]);

      if (resAvisos.status === "fulfilled") {
        setTodosAvisos(resAvisos.value.datos);
      }
      if (resLineas.status === "fulfilled") {
        setLineas(resLineas.value.datos);
      }
    } catch (err) {
      console.warn("Error cargando avisos:", err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const onRefresh = async () => {
    setRefrescando(true);
    await cargarDatos();
    setRefrescando(false);
  };

  // Filtrado de avisos según el chip activo
  const avisosFiltrados = filtrarAvisos(
    todosAvisos,
    filtroActual,
    ["lin-05", "lin-14"],
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
        {avisosFiltrados.length === 0 ? (
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

        {/* 4. Pie de estado de actualización */}
        <Text style={[styles.actualizadoTexto, { color: paleta.textoBajo }]}>
          {formatearTiempoActualizacion(3)}
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
  actualizadoTexto: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
  },
});
