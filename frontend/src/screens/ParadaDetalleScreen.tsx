import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DemoraReporteCard } from "../components/parada/DemoraReporteCard";
import { LineaHorarioCard } from "../components/parada/LineaHorarioCard";
import { ParadaHeader } from "../components/parada/ParadaHeader";
import { ParadaInfoBar } from "../components/parada/ParadaInfoBar";
import { useThemeContext } from "../hooks/use-theme-context";
import { obtenerLineas } from "../services/lineas.service";
import {
  calcularProximosHorarios,
  obtenerHorariosPorParada,
  obtenerParadaPorId,
} from "../services/paradas.service";
import {
  confirmarReporte,
  obtenerReportesPorParada,
} from "../services/reportes.service";
import type { Horario, Linea, Parada, ReporteDeDemora } from "../types";

export function ParadaDetalleScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { paleta } = useThemeContext();

  const paradaId = route.params?.paradaId ?? "par-101";

  const [parada, setParada] = useState<Parada>({
    id: "par-101",
    nombre: "Alameda y Urquiza",
    coordenadas: { latitud: -31.7333, longitud: -60.5241 },
    lineaIds: ["lin-05", "lin-14"],
    sentido: "ida",
    refugio: true,
    codigoQr: "PARANA:par-101",
  });

  const [lineas, setLineas] = useState<Linea[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [reportes, setReportes] = useState<ReporteDeDemora[]>([]);
  const [reportesConfirmados, setReportesConfirmados] = useState<string[]>([]);
  const [esFavorita, setEsFavorita] = useState<boolean>(true);

  useEffect(() => {
    let activo = true;

    async function cargarDetalle() {
      try {
        const [resParada, resLineas, resHorarios, resReportes] =
          await Promise.allSettled([
            obtenerParadaPorId(paradaId),
            obtenerLineas(),
            obtenerHorariosPorParada(paradaId),
            obtenerReportesPorParada(paradaId),
          ]);

        if (activo) {
          if (resParada.status === "fulfilled") setParada(resParada.value.datos);
          if (resLineas.status === "fulfilled") setLineas(resLineas.value.datos);
          if (resHorarios.status === "fulfilled") setHorarios(resHorarios.value.datos);
          if (resReportes.status === "fulfilled") setReportes(resReportes.value.datos);
        }
      } catch (err) {
        console.warn("Error cargando detalle de parada:", err);
      }
    }

    cargarDetalle();

    return () => {
      activo = false;
    };
  }, [paradaId]);

  const handleConfirmarDemora = async (reporteId: string) => {
    try {
      const res = await confirmarReporte(reporteId);
      setReportes((prev) =>
        prev.map((r) => (r.id === reporteId ? res.datos : r)),
      );
      setReportesConfirmados((prev) => [...prev, reporteId]);
      Alert.alert(
        "Confirmación registrada",
        "¡Gracias! Tu confirmación ayuda a los demás pasajeros que están esperando.",
      );
    } catch (err: any) {
      Alert.alert("Aviso", err?.message || "No se pudo registrar la confirmación.");
    }
  };

  const handleReportarDemora = () => {
    navigation.navigate("ReportarDemora", {
      paradaId: parada.id,
      nombreParada: parada.nombre,
    });
  };

  // Configuramos las dos líneas principales según la maqueta
  const infoLineas = parada.lineaIds.map((lId) => {
    const lObj = lineas.find((l) => l.id === lId);
    const numero = lObj?.numero ?? (lId === "lin-05" ? "5" : "14");
    const color =
      lObj?.color ?? (lId === "lin-05" ? "#1B6CA8" : "#B45309");

    // Recorrido de ida según PDF
    const destino =
      lId === "lin-05"
        ? "hacia Puerto Viejo"
        : "hacia Bajada Grande";

    const calc = calcularProximosHorarios(horarios, lId, "10:34", 3);

    // En la maqueta, para la Línea 5 se muestra explícitamente "en 8 min, según tabla"
    const etiquetaMinutos =
      lId === "lin-05" && calc.minutosFaltantesPrimerHorario !== undefined
        ? `en ${calc.minutosFaltantesPrimerHorario} min, según tabla`
        : undefined;

    return {
      id: lId,
      numero,
      destino,
      color,
      proximo: calc.proximos[0] ?? (lId === "lin-05" ? "10:42" : "10:51"),
      siguientes:
        calc.proximos.length > 1
          ? calc.proximos.slice(1)
          : lId === "lin-05"
            ? ["11:02", "11:22"]
            : ["11:21", "11:51"],
      etiquetaMinutos,
      finalizoServicio: calc.finalizoServicio,
      primerHorarioManana: calc.primerHorarioManana,
    };
  });

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: paleta.fondoApp }]}
    >
      {/* 1. Header con volver, nombre y estrella de favorito */}
      <ParadaHeader
        nombre={parada.nombre}
        esFavorita={esFavorita}
        onPressVolver={() => navigation.goBack()}
        onToggleFavorita={() => setEsFavorita((prev) => !prev)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Barra de orientación y enlace Cómo llegar */}
        <ParadaInfoBar
          distancia="120 m"
          sentidoTexto="hacia el centro"
          coordenadas={parada.coordenadas}
          nombreParada={parada.nombre}
        />

        {/* 3. Tarjetas de cada línea con sus horarios */}
        {infoLineas.map((item) => (
          <LineaHorarioCard
            key={item.id}
            numero={item.numero}
            destino={item.destino}
            color={item.color}
            proximo={item.proximo}
            etiquetaMinutos={item.etiquetaMinutos}
            siguientes={item.siguientes}
            finalizoServicio={item.finalizoServicio}
            primerHorarioManana={item.primerHorarioManana}
          />
        ))}

        {/* 4. Reporte de demoras colaborativo */}
        {reportes.map((rep) => (
          <DemoraReporteCard
            key={rep.id}
            reporte={rep}
            onConfirmar={handleConfirmarDemora}
            confirmadoPorMi={reportesConfirmados.includes(rep.id)}
          />
        ))}
      </ScrollView>

      {/* 5. Botón inferior fijo: Reportar una demora */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: paleta.fondoApp,
            borderTopColor: paleta.borde,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleReportarDemora}
          style={[styles.botonReportar, { backgroundColor: paleta.acento }]}
        >
          <Text
            style={[
              styles.botonReportarTexto,
              { color: paleta.textoSobreAcento },
            ]}
          >
            Reportar una demora
          </Text>
        </TouchableOpacity>
      </View>
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
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  botonReportar: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  botonReportarTexto: {
    fontSize: 16,
    fontWeight: "700",
  },
});
