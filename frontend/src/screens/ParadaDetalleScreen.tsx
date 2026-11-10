import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
   Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DemoraReporteCard } from "../components/parada/DemoraReporteCard";
import { LineaHorarioCard } from "../components/parada/LineaHorarioCard";
import { ParadaHeader } from "../components/parada/ParadaHeader";
import { ParadaInfoBar } from "../components/parada/ParadaInfoBar";
import { AuthContext } from "../contexts/AuthContext";
import { useThemeContext } from "../hooks/use-theme-context";
import {
  calcularDistanciaMetros,
  useUbicacion,
} from "../hooks/use-ubicacion";
import { obtenerLineas } from "../services/lineas.service";
import {
  calcularProximosHorarios,
  obtenerHorariosPorParada,
  obtenerParadaPorId,
  obtenerTipoDeDiaActual,
} from "../services/paradas.service";
import {
  confirmarReporte,
  obtenerReportesPorParada,
} from "../services/reportes.service";
import type { Horario, Linea, Parada, ReporteDeDemora, TipoDeDia } from "../types";

const OPCIONES_DIA: Array<{ id: TipoDeDia; label: string }> = [
  { id: "habil", label: "Hábiles" },
  { id: "sabado", label: "Sábados" },
  { id: "domingo", label: "Domingos" },
  { id: "feriado", label: "Feriados" },
];

export function ParadaDetalleScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { paleta } = useThemeContext();
  const auth = useContext(AuthContext);
  const { coordenadas: usuarioCoords } = useUbicacion();

  const paradaId = route.params?.paradaId ?? "par-101";
  const esFavorita = Boolean(auth?.paradasFavoritas.includes(paradaId));

  const [parada, setParada] = useState<Parada>({
    id: "par-101",
    nombre: "Alameda y Urquiza",
    coordenadas: { latitud: -31.7333, longitud: -60.5241 },
    lineaIds: ["lin-05", "lin-14"],
    sentido: "ida",
    refugio: true,
    codigoQr: "PARANA:par-101",
  });

  const distanciaTexto = useMemo(() => {
    const metros = calcularDistanciaMetros(usuarioCoords, parada.coordenadas);
    return `${metros} m`;
  }, [usuarioCoords, parada.coordenadas]);

  const [lineas, setLineas] = useState<Linea[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [reportes, setReportes] = useState<ReporteDeDemora[]>([]);
  const [reportesConfirmados, setReportesConfirmados] = useState<string[]>([]);
  const [tipoDiaSeleccionado, setTipoDiaSeleccionado] = useState<TipoDeDia>(() =>
    obtenerTipoDeDiaActual(),
  );
  const [recordatoriosActivos, setRecordatoriosActivos] = useState<Record<string, boolean>>({});
  const timersRecordatorioRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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
      Object.values(timersRecordatorioRef.current).forEach(clearTimeout);
    };
  }, [paradaId]);

  const handleConfirmarDemora = async (reporteId: string) => {
    try {
      // Vibración háptica corta al confirmar el reporte ajeno
      Vibration.vibrate(40);
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

  const handleToggleRecordatorio = (numeroLinea: string, horaColectivo: string) => {
    const clave = `${numeroLinea}-${horaColectivo}`;

    if (recordatoriosActivos[clave]) {
      if (timersRecordatorioRef.current[clave]) {
        clearTimeout(timersRecordatorioRef.current[clave]);
        delete timersRecordatorioRef.current[clave];
      }
      setRecordatoriosActivos((prev) => ({ ...prev, [clave]: false }));
      Alert.alert(
        "Recordatorio cancelado",
        `Desactivaste el aviso para la Línea ${numeroLinea} de las ${horaColectivo}.`,
      );
      return;
    }

    // Calculamos cuánto falta para 10 minutos antes del colectivo
    const ahora = new Date();
    const [hh, mm] = horaColectivo.split(":").map(Number);
    const minutosObjetivo = hh * 60 + mm - 10;
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    const diferenciaMin = minutosObjetivo - minutosActuales;

    const horaAvisoH = String(Math.floor(((minutosObjetivo + 1440) % 1440) / 60)).padStart(2, "0");
    const horaAvisoM = String(((minutosObjetivo + 1440) % 1440) % 60).padStart(2, "0");
    const horaAvisoTexto = `${horaAvisoH}:${horaAvisoM}`;

    setRecordatoriosActivos((prev) => ({ ...prev, [clave]: true }));

    if (diferenciaMin > 0) {
      timersRecordatorioRef.current[clave] = setTimeout(() => {
        Alert.alert(
          `🚌 Línea ${numeroLinea} en 10 minutos`,
          `El colectivo de las ${horaColectivo} está próximo a pasar por ${parada.nombre} (según tabla).`,
        );
        setRecordatoriosActivos((prev) => ({ ...prev, [clave]: false }));
      }, diferenciaMin * 60 * 1000);
    }

    Alert.alert(
      "Recordatorio programado",
      diferenciaMin > 0
        ? `Te vamos a avisar a las ${horaAvisoTexto} (10 minutos antes del servicio de las ${horaColectivo} de la Línea ${numeroLinea}).`
        : `Faltan menos de 10 minutos para el colectivo de las ${horaColectivo} de la Línea ${numeroLinea}. ¡Acercate a la parada!`,
    );
  };

  // Configuramos todas las líneas que pasan por la parada según el día seleccionado y la hora actual real
  const infoLineas = parada.lineaIds.map((lId) => {
    const lObj = lineas.find((l) => l.id === lId);
    const numero = lObj?.numero ?? lId.replace("lin-0", "").replace("lin-", "");
    const color =
      lObj?.color ?? (lId === "lin-05" ? "#1B6CA8" : "#B45309");

    // Destino según sentido de la parada
    const recorridoParada = lObj?.recorridos.find(
      (r) => r.sentido === parada.sentido,
    );
    const destino =
      recorridoParada?.destino ??
      (lId === "lin-05" ? "hacia Puerto Viejo" : "hacia Bajada Grande");

    const calc = calcularProximosHorarios(
      horarios,
      lId,
      undefined, // Usa la hora real del reloj del dispositivo
      3,
      tipoDiaSeleccionado,
    );

    const etiquetaMinutos =
      calc.minutosFaltantesPrimerHorario !== undefined
        ? calc.minutosFaltantesPrimerHorario === 0
          ? "llegando ahora, según tabla"
          : `en ${calc.minutosFaltantesPrimerHorario} min, según tabla`
        : undefined;

    const proximoHora = calc.proximos[0] ?? (lId === "lin-05" ? "10:42" : "10:51");

    return {
      id: lId,
      numero,
      destino,
      color,
      proximo: proximoHora,
      siguientes: calc.proximos.length > 1 ? calc.proximos.slice(1) : [],
      todosLosHorarios: calc.todosDelDia,
      etiquetaMinutos,
      finalizoServicio: calc.finalizoServicio,
      primerHorarioManana: calc.primerHorarioManana,
      ultimoHorarioHoy: calc.ultimoHorarioHoy,
      recordatorioActivo: Boolean(recordatoriosActivos[`${numero}-${proximoHora}`]),
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
        onPressVolver={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate("MainTabs");
          }
        }}
        onToggleFavorita={() => auth?.alternarParadaFavorita(parada.id)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Barra de orientación con brújula/rumbo y enlace Cómo llegar */}
        <ParadaInfoBar
          distancia={distanciaTexto}
          sentidoTexto={parada.sentido === "ida" ? "hacia el centro" : "sentido vuelta"}
          coordenadas={parada.coordenadas}
          usuarioCoordenadas={usuarioCoords}
          nombreParada={parada.nombre}
        />

        {/* 3. Selector de tipo de día (Hábiles / Sábados / Domingos / Feriados) */}
        <View style={styles.selectorDiaContainer}>
          {OPCIONES_DIA.map((op) => {
            const activo = tipoDiaSeleccionado === op.id;
            return (
              <TouchableOpacity
                key={op.id}
                activeOpacity={0.75}
                onPress={() => setTipoDiaSeleccionado(op.id)}
                style={[
                  styles.chipDia,
                  activo
                    ? { backgroundColor: paleta.acento, borderColor: paleta.acento }
                    : {
                        backgroundColor: paleta.superficie1,
                        borderColor: paleta.borde,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.chipDiaTexto,
                    {
                      color: activo ? paleta.textoSobreAcento : paleta.textoMedio,
                    },
                  ]}
                >
                  {op.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. Tarjetas de cada línea con sus horarios, tabla completa y recordatorio */}
        {infoLineas.map((item) => (
          <LineaHorarioCard
            key={item.id}
            numero={item.numero}
            destino={item.destino}
            color={item.color}
            proximo={item.proximo}
            etiquetaMinutos={item.etiquetaMinutos}
            siguientes={item.siguientes}
            todosLosHorarios={item.todosLosHorarios}
            finalizoServicio={item.finalizoServicio}
            primerHorarioManana={item.primerHorarioManana}
            ultimoHorarioHoy={item.ultimoHorarioHoy}
            recordatorioActivo={item.recordatorioActivo}
            onPressRecordatorio={handleToggleRecordatorio}
          />
        ))}

        {/* 5. Reporte de demoras colaborativo */}
        {reportes.map((rep) => (
          <DemoraReporteCard
            key={rep.id}
            reporte={rep}
            onConfirmar={handleConfirmarDemora}
            confirmadoPorMi={reportesConfirmados.includes(rep.id)}
          />
        ))}
      </ScrollView>

      {/* 6. Botón inferior fijo: Reportar una demora */}
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
  selectorDiaContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 8,
  },
  chipDia: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipDiaTexto: {
    fontSize: 12,
    fontWeight: "700",
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
