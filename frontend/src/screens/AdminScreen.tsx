import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvisosHeader } from "../components/avisos/AvisosHeader";
import { useThemeContext } from "../hooks/use-theme-context";
import {
  crearAviso,
  darDeBajaAviso,
  editarAviso,
  obtenerResumenReportes,
  type ResumenDemoras,
} from "../services/admin.service";
import { obtenerAvisos, obtenerLineas } from "../services/lineas.service";
import { obtenerParadas } from "../services/paradas.service";
import type { Aviso, Gravedad, Linea, Parada } from "../types";

type Seccion = "avisos" | "reportes";
type Agrupado = "linea" | "parada";

const GRAVEDADES: Array<{ id: Gravedad; label: string }> = [
  { id: "informativo", label: "Informativo" },
  { id: "desvio", label: "Desvío" },
  { id: "suspension", label: "Suspensión" },
];

const DURACIONES: Array<{ label: string; horas: number | null }> = [
  { label: "Sin fin", horas: null },
  { label: "1 día", horas: 24 },
  { label: "3 días", horas: 72 },
  { label: "7 días", horas: 168 },
];

function mensajeDeError(err: unknown, porDefecto: string): string {
  return err instanceof Error && err.message ? err.message : porDefecto;
}

function formatearFechaHora(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

export function AdminScreen() {
  const { paleta } = useThemeContext();

  const [seccion, setSeccion] = useState<Seccion>("avisos");
  const [agrupado, setAgrupado] = useState<Agrupado>("linea");

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [resumen, setResumen] = useState<ResumenDemoras[]>([]);

  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState<Aviso | null>(null);
  const [titulo, setTitulo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [lineasSel, setLineasSel] = useState<string[]>([]);
  const [gravedad, setGravedad] = useState<Gravedad>("informativo");
  const [duracionIdx, setDuracionIdx] = useState(0);
  const [guardando, setGuardando] = useState(false);

  const cargarAvisos = useCallback(async () => {
    const res = await obtenerAvisos("todos");
    const ahora = new Date().toISOString();
    setAvisos(res.datos.filter((a) => !a.hasta || a.hasta >= ahora));
  }, []);

  const cargarResumen = useCallback(async (modo: Agrupado) => {
    const res = await obtenerResumenReportes(modo);
    setResumen(res.datos ?? []);
  }, []);

  const cargarTodo = useCallback(async () => {
    setErrorCarga(null);
    try {
      const [resLineas, resParadas] = await Promise.all([
        obtenerLineas(),
        obtenerParadas(),
      ]);
      setLineas(resLineas.datos);
      setParadas(resParadas.datos);
      await cargarAvisos();
      await cargarResumen(agrupado);
    } catch (err) {
      setErrorCarga(mensajeDeError(err, "No se pudo cargar el panel."));
    } finally {
      setCargando(false);
    }
  }, [agrupado, cargarAvisos, cargarResumen]);

  useEffect(() => {
    cargarTodo();
  }, []);

  useEffect(() => {
    if (cargando) return;
    cargarResumen(agrupado).catch((err) =>
      setErrorCarga(mensajeDeError(err, "No se pudo cargar los reportes.")),
    );
  }, [agrupado]);

  const onRefresh = async () => {
    setRefrescando(true);
    await cargarTodo();
    setRefrescando(false);
  };

  const nombreLinea = useMemo(() => {
    const mapa = new Map(lineas.map((l) => [l.id, l.numero]));
    return (id: string) => mapa.get(id) ?? id.replace("lin-0", "").replace("lin-", "");
  }, [lineas]);

  const nombreParada = useMemo(() => {
    const mapa = new Map(paradas.map((p) => [p.id, p.nombre]));
    return (id: string) => mapa.get(id) ?? id;
  }, [paradas]);

  const abrirNuevo = () => {
    setEditando(null);
    setTitulo("");
    setDetalle("");
    setLineasSel([]);
    setGravedad("informativo");
    setDuracionIdx(0);
    setFormVisible(true);
  };

  const abrirEdicion = (aviso: Aviso) => {
    setEditando(aviso);
    setTitulo(aviso.titulo);
    setDetalle(aviso.detalle);
    setLineasSel(aviso.lineaIds);
    setGravedad(aviso.gravedad);
    setDuracionIdx(0);
    setFormVisible(true);
  };

  const alternarLinea = (id: string) =>
    setLineasSel((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const guardar = async () => {
    if (!titulo.trim() || !detalle.trim() || lineasSel.length === 0) {
      Alert.alert(
        "Faltan datos",
        "Completá el título, el detalle y elegí al menos una línea.",
      );
      return;
    }
    setGuardando(true);
    try {
      const horas = DURACIONES[duracionIdx].horas;
      if (editando) {
        const cambios: Parameters<typeof editarAviso>[1] = {
          titulo: titulo.trim(),
          detalle: detalle.trim(),
          lineaIds: lineasSel,
          gravedad,
        };
        if (horas !== null) {
          cambios.hasta = new Date(Date.now() + horas * 3600000).toISOString();
        }
        await editarAviso(editando.id, cambios);
      } else {
        await crearAviso({
          titulo: titulo.trim(),
          detalle: detalle.trim(),
          lineaIds: lineasSel,
          gravedad,
          hasta:
            horas === null
              ? null
              : new Date(Date.now() + horas * 3600000).toISOString(),
        });
      }
      setFormVisible(false);
      await cargarAvisos();
    } catch (err) {
      Alert.alert(
        "No se pudo guardar",
        mensajeDeError(err, "Intentá de nuevo en unos instantes."),
      );
    } finally {
      setGuardando(false);
    }
  };

  const confirmarBaja = (aviso: Aviso) => {
    Alert.alert(
      "Dar de baja el aviso",
      `"${aviso.titulo}" dejará de mostrarse a todos los usuarios.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Dar de baja",
          style: "destructive",
          onPress: async () => {
            try {
              await darDeBajaAviso(aviso.id);
              setAvisos((prev) => prev.filter((a) => a.id !== aviso.id));
            } catch (err) {
              Alert.alert(
                "No se pudo dar de baja",
                mensajeDeError(err, "Intentá de nuevo."),
              );
            }
          },
        },
      ],
    );
  };

  const colorGravedad = (g: Gravedad) => paleta.gravedadAviso[g];

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: paleta.fondoApp }]}
    >
      <AvisosHeader titulo="Administración" />

      <View style={styles.chipsFila}>
        {(
          [
            { id: "avisos", label: "Avisos" },
            { id: "reportes", label: "Reportes" },
          ] as Array<{ id: Seccion; label: string }>
        ).map((op) => {
          const activo = seccion === op.id;
          return (
            <TouchableOpacity
              key={op.id}
              activeOpacity={0.8}
              onPress={() => setSeccion(op.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: activo ? paleta.acento : paleta.superficie2,
                  borderColor: activo ? paleta.acento : paleta.borde,
                },
              ]}
            >
              <Text
                style={{
                  color: activo ? paleta.textoSobreAcento : paleta.textoMedio,
                  fontWeight: activo ? "700" : "500",
                  fontSize: 14,
                }}
              >
                {op.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
        {cargando ? (
          <ActivityIndicator
            size="large"
            color={paleta.acento}
            style={{ marginTop: 30 }}
          />
        ) : errorCarga ? (
          <View style={styles.vacio}>
            <Ionicons
              name="alert-circle-outline"
              size={36}
              color={paleta.advertencia}
            />
            <Text style={[styles.vacioTexto, { color: paleta.textoMedio }]}>
              {errorCarga}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setCargando(true);
                cargarTodo();
              }}
              style={[styles.boton, { backgroundColor: paleta.acento }]}
            >
              <Text style={{ color: paleta.textoSobreAcento, fontWeight: "700" }}>
                Reintentar
              </Text>
            </TouchableOpacity>
          </View>
        ) : seccion === "avisos" ? (
          <>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={abrirNuevo}
              style={[styles.boton, styles.botonNuevo, { backgroundColor: paleta.acento }]}
            >
              <Ionicons name="add" size={18} color={paleta.textoSobreAcento} />
              <Text style={{ color: paleta.textoSobreAcento, fontWeight: "700" }}>
                Publicar aviso
              </Text>
            </TouchableOpacity>

            {avisos.length === 0 ? (
              <View style={styles.vacio}>
                <Text style={[styles.vacioTexto, { color: paleta.textoMedio }]}>
                  No hay avisos publicados.
                </Text>
              </View>
            ) : (
              avisos.map((aviso) => {
                const g = colorGravedad(aviso.gravedad);
                const programado = aviso.desde > new Date().toISOString();
                return (
                  <View
                    key={aviso.id}
                    style={[
                      styles.card,
                      { backgroundColor: paleta.superficie1, borderColor: g.borde },
                    ]}
                  >
                    <View style={styles.cardCabecera}>
                      <View style={[styles.etiqueta, { backgroundColor: g.fondo }]}>
                        <Text style={{ color: g.texto, fontSize: 12, fontWeight: "700" }}>
                          {aviso.gravedad.toUpperCase()}
                        </Text>
                      </View>
                      {programado ? (
                        <Text style={{ color: paleta.textoBajo, fontSize: 12 }}>
                          Programado
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.cardTitulo, { color: paleta.textoAlto }]}>
                      {aviso.titulo}
                    </Text>
                    <Text style={{ color: paleta.textoMedio, fontSize: 14 }}>
                      {aviso.detalle}
                    </Text>
                    <Text style={{ color: paleta.textoBajo, fontSize: 12, marginTop: 6 }}>
                      Líneas: {aviso.lineaIds.map(nombreLinea).join(", ")} · Desde{" "}
                      {formatearFechaHora(aviso.desde)}
                      {aviso.hasta
                        ? ` · Hasta ${formatearFechaHora(aviso.hasta)}`
                        : " · Sin fecha de fin"}
                    </Text>
                    <View style={styles.accionesFila}>
                      <TouchableOpacity
                        onPress={() => abrirEdicion(aviso)}
                        style={[styles.botonChico, { borderColor: paleta.borde }]}
                      >
                        <Ionicons name="create-outline" size={16} color={paleta.acento} />
                        <Text style={{ color: paleta.acento, fontWeight: "600" }}>
                          Editar
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => confirmarBaja(aviso)}
                        style={[styles.botonChico, { borderColor: paleta.borde }]}
                      >
                        <Ionicons name="trash-outline" size={16} color={paleta.error} />
                        <Text style={{ color: paleta.error, fontWeight: "600" }}>
                          Dar de baja
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        ) : (
          <>
            <View style={styles.chipsFila}>
              {(
                [
                  { id: "linea", label: "Por línea" },
                  { id: "parada", label: "Por parada" },
                ] as Array<{ id: Agrupado; label: string }>
              ).map((op) => {
                const activo = agrupado === op.id;
                return (
                  <TouchableOpacity
                    key={op.id}
                    activeOpacity={0.8}
                    onPress={() => setAgrupado(op.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: activo ? paleta.acento : paleta.superficie2,
                        borderColor: activo ? paleta.acento : paleta.borde,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: activo ? paleta.textoSobreAcento : paleta.textoMedio,
                        fontWeight: activo ? "700" : "500",
                        fontSize: 13,
                      }}
                    >
                      {op.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {resumen.length === 0 ? (
              <View style={styles.vacio}>
                <Text style={[styles.vacioTexto, { color: paleta.textoMedio }]}>
                  Todavía no hay reportes de demora.
                </Text>
              </View>
            ) : (
              resumen.map((fila) => {
                const linea = lineas.find((l) => l.id === fila.lineaId);
                return (
                  <View
                    key={`${fila.lineaId}-${fila.paradaId ?? "todas"}`}
                    style={[
                      styles.card,
                      { backgroundColor: paleta.superficie1, borderColor: paleta.borde },
                    ]}
                  >
                    <View style={styles.cardCabecera}>
                      <View
                        style={[
                          styles.badgeLinea,
                          { backgroundColor: linea?.color ?? paleta.acento },
                        ]}
                      >
                        <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                          {nombreLinea(fila.lineaId)}
                        </Text>
                      </View>
                      <Text
                        style={[styles.cardTitulo, { color: paleta.textoAlto, flex: 1, marginBottom: 0 }]}
                        numberOfLines={2}
                      >
                        {fila.paradaId
                          ? nombreParada(fila.paradaId)
                          : (linea?.nombre ?? `Línea ${nombreLinea(fila.lineaId)}`)}
                      </Text>
                    </View>
                    <Text style={{ color: paleta.textoMedio, fontSize: 14, marginTop: 8 }}>
                      {fila.cantidad} {fila.cantidad === 1 ? "reporte" : "reportes"} ·{" "}
                      {fila.confirmaciones}{" "}
                      {fila.confirmaciones === 1 ? "confirmación" : "confirmaciones"}
                    </Text>
                    <Text style={{ color: paleta.textoBajo, fontSize: 12, marginTop: 2 }}>
                      Último reporte: {formatearFechaHora(fila.ultimo)}
                    </Text>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={formVisible}
        animationType="slide"
        onRequestClose={() => setFormVisible(false)}
      >
        <SafeAreaView style={[styles.safeArea, { backgroundColor: paleta.fondoApp }]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.formContenido}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.formTitulo, { color: paleta.textoAlto }]}>
                {editando ? "Editar aviso" : "Publicar aviso"}
              </Text>

              <Text style={[styles.etiquetaCampo, { color: paleta.textoMedio }]}>Título</Text>
              <TextInput
                value={titulo}
                onChangeText={setTitulo}
                maxLength={200}
                placeholder="Ej: Desvío por obra en calle Corrientes"
                placeholderTextColor={paleta.textoBajo}
                style={[
                  styles.input,
                  { color: paleta.textoAlto, borderColor: paleta.borde, backgroundColor: paleta.superficie1 },
                ]}
              />

              <Text style={[styles.etiquetaCampo, { color: paleta.textoMedio }]}>Detalle</Text>
              <TextInput
                value={detalle}
                onChangeText={setDetalle}
                multiline
                maxLength={4000}
                placeholder="Describí qué cambia y por cuánto tiempo"
                placeholderTextColor={paleta.textoBajo}
                style={[
                  styles.input,
                  styles.inputMultilinea,
                  { color: paleta.textoAlto, borderColor: paleta.borde, backgroundColor: paleta.superficie1 },
                ]}
              />

              <Text style={[styles.etiquetaCampo, { color: paleta.textoMedio }]}>Gravedad</Text>
              <View style={styles.chipsFilaInterna}>
                {GRAVEDADES.map((g) => {
                  const activo = gravedad === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => setGravedad(g.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: activo ? paleta.acento : paleta.superficie2,
                          borderColor: activo ? paleta.acento : paleta.borde,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: activo ? paleta.textoSobreAcento : paleta.textoMedio,
                          fontWeight: activo ? "700" : "500",
                        }}
                      >
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.etiquetaCampo, { color: paleta.textoMedio }]}>
                Líneas afectadas
              </Text>
              <View style={styles.chipsFilaInterna}>
                {lineas
                  .filter((l) => l.activa)
                  .map((l) => {
                    const activo = lineasSel.includes(l.id);
                    return (
                      <TouchableOpacity
                        key={l.id}
                        onPress={() => alternarLinea(l.id)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: activo ? paleta.acento : paleta.superficie2,
                            borderColor: activo ? paleta.acento : paleta.borde,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: activo ? paleta.textoSobreAcento : paleta.textoMedio,
                            fontWeight: activo ? "700" : "500",
                          }}
                        >
                          {l.numero}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>

              <Text style={[styles.etiquetaCampo, { color: paleta.textoMedio }]}>
                {editando ? "Cambiar duración (opcional)" : "Duración"}
              </Text>
              <View style={styles.chipsFilaInterna}>
                {DURACIONES.map((d, idx) => {
                  const activo = duracionIdx === idx;
                  return (
                    <TouchableOpacity
                      key={d.label}
                      onPress={() => setDuracionIdx(idx)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: activo ? paleta.acento : paleta.superficie2,
                          borderColor: activo ? paleta.acento : paleta.borde,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: activo ? paleta.textoSobreAcento : paleta.textoMedio,
                          fontWeight: activo ? "700" : "500",
                        }}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.accionesFila}>
                <TouchableOpacity
                  onPress={() => setFormVisible(false)}
                  disabled={guardando}
                  style={[styles.boton, { borderColor: paleta.borde, borderWidth: 1, flex: 1 }]}
                >
                  <Text style={{ color: paleta.textoMedio, fontWeight: "700" }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={guardar}
                  disabled={guardando}
                  style={[styles.boton, { backgroundColor: paleta.acento, flex: 1 }]}
                >
                  {guardando ? (
                    <ActivityIndicator color={paleta.textoSobreAcento} />
                  ) : (
                    <Text style={{ color: paleta.textoSobreAcento, fontWeight: "700" }}>
                      {editando ? "Guardar cambios" : "Publicar"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 28 },
  chipsFila: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  chipsFilaInterna: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  vacio: { padding: 32, alignItems: "center", gap: 10 },
  vacioTexto: { fontSize: 15, textAlign: "center" },
  boton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  botonNuevo: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardCabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  cardTitulo: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  etiqueta: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeLinea: {
    minWidth: 36,
    height: 28,
    borderRadius: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  accionesFila: { flexDirection: "row", gap: 10, marginTop: 12 },
  botonChico: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  formContenido: { padding: 18, paddingBottom: 40 },
  formTitulo: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  etiquetaCampo: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputMultilinea: { minHeight: 100, textAlignVertical: "top" },
});

