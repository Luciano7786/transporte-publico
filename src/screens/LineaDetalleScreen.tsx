import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineaAvisoBanner } from "../components/linea/LineaAvisoBanner";
import { LineaHeader } from "../components/linea/LineaHeader";
import { MapaRecorrido } from "../components/linea/MapaRecorrido";
import {
  ItemParadaTimeline,
  ParadasTimeline,
} from "../components/linea/ParadasTimeline";
import { SentidoSelector } from "../components/linea/SentidoSelector";
import { useThemeContext } from "../hooks/use-theme-context";
import {
  obtenerAvisoVigentePorLinea,
  obtenerLineaPorId,
} from "../services/lineas.service";
import { obtenerParadas } from "../services/paradas.service";
import type { Aviso, Linea, Sentido } from "../types";

export function LineaDetalleScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { paleta } = useThemeContext();

  const lineaId = route.params?.lineaId ?? "lin-07";

  const [linea, setLinea] = useState<Linea>({
    id: "lin-07",
    numero: "7",
    nombre: "Centro — Bajada Grande",
    color: "#0F766E",
    empresa: "Transporte Mariano Moreno",
    activa: true,
    recorridos: [
      {
        sentido: "ida",
        destino: "a Bajada Grande",
        trazado: [
          { latitud: -31.732, longitud: -60.529 },
          { latitud: -31.7335, longitud: -60.527 },
          { latitud: -31.7345, longitud: -60.5255 },
          { latitud: -31.736, longitud: -60.523 },
          { latitud: -31.74, longitud: -60.515 },
          { latitud: -31.748, longitud: -60.495 },
        ],
        paradaIds: ["par-102", "par-103", "par-104", "par-109"],
      },
      {
        sentido: "vuelta",
        destino: "al Centro",
        trazado: [
          { latitud: -31.748, longitud: -60.495 },
          { latitud: -31.743, longitud: -60.512 },
          { latitud: -31.737, longitud: -60.522 },
          { latitud: -31.732, longitud: -60.529 },
        ],
        paradaIds: ["par-109", "par-104", "par-102"],
      },
    ],
  });

  const [aviso, setAviso] = useState<Aviso | null>({
    id: "avi-088",
    titulo: "Desvío por obra en Corrientes",
    detalle: "Las líneas 2, 7 y 9 desvían por Santa Fe.",
    lineaIds: ["lin-02", "lin-07", "lin-09"],
    desde: "2026-09-14T00:00:00-03:00",
    hasta: "2026-10-05T23:59:00-03:00",
    gravedad: "desvio",
    trazadoAlternativo: [
      { latitud: -31.7345, longitud: -60.523 },
      { latitud: -31.7352, longitud: -60.5218 },
      { latitud: -31.7361, longitud: -60.5205 },
    ],
    videoUrl: null,
  });

  const [sentido, setSentido] = useState<Sentido>("ida");
  const [paradasMapeadas, setParadasMapeadas] = useState<ItemParadaTimeline[]>(
    [],
  );

  useEffect(() => {
    let activo = true;

    async function cargarDatosLinea() {
      try {
        const [resLinea, resAviso, resParadas] = await Promise.allSettled([
          obtenerLineaPorId(lineaId),
          obtenerAvisoVigentePorLinea(lineaId),
          obtenerParadas(),
        ]);

        if (activo) {
          if (resLinea.status === "fulfilled") setLinea(resLinea.value.datos);
          if (resAviso.status === "fulfilled") setAviso(resAviso.value);

          const todasParadas =
            resParadas.status === "fulfilled" ? resParadas.value.datos : [];

          // Construir lista con estados para Línea 7
          const recorridoActual =
            resLinea.status === "fulfilled"
              ? resLinea.value.datos.recorridos.find(
                  (r) => r.sentido === sentido,
                )
              : null;

          const ids = recorridoActual?.paradaIds ?? [
            "par-102",
            "par-103",
            "par-104",
            "par-109",
          ];

          const items: ItemParadaTimeline[] = ids.map((id) => {
            const encontrada = todasParadas.find((p) => p.id === id);
            let estado: "normal" | "sin_servicio" | "provisoria" = "normal";

            // En sentido IDA con el desvío de calle Corrientes
            if (sentido === "ida") {
              if (id === "par-103") estado = "sin_servicio"; // Corrientes y 25 de Mayo
              if (id === "par-104") estado = "provisoria"; // Santa Fe y Urquiza
            }

            return {
              id,
              nombre: encontrada?.nombre ?? id,
              estado,
            };
          });

          setParadasMapeadas(items);
        }
      } catch (err) {
        console.warn("Error cargando detalle de línea:", err);
      }
    }

    cargarDatosLinea();

    return () => {
      activo = false;
    };
  }, [lineaId, sentido]);

  const recorridoIda = linea.recorridos.find((r) => r.sentido === "ida");
  const recorridoVuelta = linea.recorridos.find((r) => r.sentido === "vuelta");
  const recorridoActual =
    sentido === "ida" ? recorridoIda : recorridoVuelta;

  const handleVerAviso = () => {
    navigation.navigate("MainTabs", { screen: "Avisos" });
  };

  const handleSelectParada = (paradaId: string) => {
    navigation.navigate("ParadaDetalle", { paradaId });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: paleta.fondoApp }]}
    >
      {/* 1. Header con volver, badge de línea y nombre */}
      <LineaHeader
        numero={linea.numero}
        nombre={linea.nombre}
        color={linea.color}
        onPressVolver={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Banner de desvío vigente */}
        {aviso && aviso.gravedad === "desvio" ? (
          <LineaAvisoBanner
            titulo={aviso.titulo}
            vigencia="Hasta el 5/10"
            onPressVerAviso={handleVerAviso}
          />
        ) : null}

        {/* 3. Selector de Sentido (Ida / Vuelta) */}
        <SentidoSelector
          sentido={sentido}
          destinoIda={recorridoIda?.destino ?? "a Bajada Grande"}
          destinoVuelta={recorridoVuelta?.destino ?? "al Centro"}
          onChange={setSentido}
        />

        {/* 4. Mapa del recorrido (con trazado alternativo punteado si hay desvío en ida) */}
        <MapaRecorrido
          trazadoNormal={recorridoActual?.trazado ?? []}
          trazadoAlternativo={
            sentido === "ida" ? aviso?.trazadoAlternativo : null
          }
          colorLinea={linea.color}
          totalParadas={14}
        />

        {/* 5. Timeline vertical de paradas */}
        <ParadasTimeline
          paradas={
            paradasMapeadas.length > 0
              ? paradasMapeadas
              : [
                  { id: "par-102", nombre: "Plaza Primero de Mayo" },
                  {
                    id: "par-103",
                    nombre: "Corrientes y 25 de Mayo",
                    estado: "sin_servicio",
                  },
                  {
                    id: "par-104",
                    nombre: "Santa Fe y Urquiza",
                    estado: "provisoria",
                  },
                  { id: "par-109", nombre: "Almafuerte y Newbery" },
                ]
          }
          colorLinea={linea.color}
          onSelectParada={handleSelectParada}
        />
      </ScrollView>
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
    paddingBottom: 24,
  },
});
