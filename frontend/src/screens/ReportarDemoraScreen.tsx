import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeContext } from "../hooks/use-theme-context";
import { obtenerLineas } from "../services/lineas.service";
import { obtenerParadaPorId } from "../services/paradas.service";
import {
  crearReporte,
  guardarFotoReporteEnDispositivo,
} from "../services/reportes.service";
import type { Linea, MotivoDemora, Parada } from "../types";

export function ReportarDemoraScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { paleta } = useThemeContext();

  const paradaId = route.params?.paradaId ?? "par-101";
  const nombreParadaInicial = route.params?.nombreParada ?? "Alameda y Urquiza";

  const [parada, setParada] = useState<Parada | null>(null);
  const [lineasCatalogo, setLineasCatalogo] = useState<Linea[]>([]);

  const [lineaSeleccionada, setLineaSeleccionada] = useState<string>("lin-05");
  const [motivoSeleccionado, setMotivoSeleccionado] =
    useState<MotivoDemora>("no_paso");
  const [comentario, setComentario] = useState<string>("");
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);

  const [permisoCamara, solicitarPermisoCamara] = useCameraPermissions();
  const [camaraVisible, setCamaraVisible] = useState<boolean>(false);
  const [capturandoFoto, setCapturandoFoto] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    let activo = true;
    async function cargarLineasDeParada() {
      try {
        const [resParada, resLineas] = await Promise.allSettled([
          obtenerParadaPorId(paradaId),
          obtenerLineas(),
        ]);

        if (!activo) return;

        if (resParada.status === "fulfilled" && resParada.value.datos) {
          const p = resParada.value.datos;
          setParada(p);
          if (p.lineaIds.length > 0 && !p.lineaIds.includes(lineaSeleccionada)) {
            setLineaSeleccionada(p.lineaIds[0]);
          }
        }
        if (resLineas.status === "fulfilled" && resLineas.value.datos) {
          setLineasCatalogo(resLineas.value.datos);
        }
      } catch {
      }
    }
    cargarLineasDeParada();
    return () => {
      activo = false;
    };
  }, [paradaId]);

  const nombreParada = parada?.nombre ?? nombreParadaInicial;
  const idsLineasParada =
    parada?.lineaIds && parada.lineaIds.length > 0
      ? parada.lineaIds
      : ["lin-05", "lin-14"];

  const lineasDisponibles = idsLineasParada.map((id) => {
    const encontrada = lineasCatalogo.find((l) => l.id === id);
    return {
      id,
      numero: encontrada?.numero ?? id.replace("lin-0", "").replace("lin-", ""),
      color:
        encontrada?.color ??
        (id === "lin-05"
          ? "#1B6CA8"
          : id === "lin-14"
            ? "#B45309"
            : paleta.acento),
    };
  });

  const opcionesMotivo: Array<{ id: MotivoDemora; label: string }> = [
    { id: "no_paso", label: "No pasó" },
    { id: "paso_lleno", label: "Pasó lleno y no paró" },
    { id: "demorado", label: "Viene demorado" },
    { id: "unidad_rota", label: "Unidad rota" },
    { id: "calle_cortada", label: "Calle cortada" },
  ];

  const handleSacarFoto = async () => {
    try {
      if (!permisoCamara?.granted) {
        const res = await solicitarPermisoCamara();
        if (!res.granted) {
          Alert.alert(
            "Permiso requerido",
            "Necesitamos permiso para usar la cámara y adjuntar la foto del estado de la parada o unidad.",
          );
          return;
        }
      }
      setCamaraVisible(true);
    } catch {
      Alert.alert("Cámara", "No se pudo abrir la cámara en este dispositivo.");
    }
  };

  const handleCapturarFotoCamara = async () => {
    if (!cameraRef.current || capturandoFoto) return;
    try {
      setCapturandoFoto(true);
      const foto = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      if (foto?.uri) {
        const uriGuardada = guardarFotoReporteEnDispositivo(foto.uri);
        setFotoUri(uriGuardada);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      setCamaraVisible(false);
    } catch {
      Alert.alert(
        "Cámara",
        "No se pudo capturar la imagen. Intentá nuevamente.",
      );
    } finally {
      setCapturandoFoto(false);
    }
  };

  const handleGaleria = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          "Permiso requerido",
          "Necesitamos acceso a tu galería para seleccionar una foto de la parada o unidad.",
        );
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.75,
      });

      if (!resultado.canceled && resultado.assets && resultado.assets[0]?.uri) {
        const uriGuardada = guardarFotoReporteEnDispositivo(
          resultado.assets[0].uri,
        );
        setFotoUri(uriGuardada);
        Haptics.selectionAsync().catch(() => {});
      }
    } catch {
      Alert.alert(
        "Galería",
        "No se pudo abrir la galería de imágenes en este dispositivo.",
      );
    }
  };

  const handleEnviarReporte = async () => {
    try {
      setEnviando(true);
      const res = await crearReporte({
        lineaId: lineaSeleccionada,
        paradaId,
        motivo: motivoSeleccionado,
        comentario: comentario.trim() || null,
        fotoUri,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      const esOffline = res.datos && !res.datos.sincronizado;

      Alert.alert(
        esOffline ? "Guardado sin conexión" : "Reporte enviado",
        esOffline
          ? "No hay señal de internet. Tu reporte se guardó localmente y se enviará automáticamente al recuperar conexión."
          : "Tu aviso fue registrado. Los demás pasajeros que esperan en la parada podrán verlo y confirmarlo.",
        [
          {
            text: "Aceptar",
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("MainTabs");
              }
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        "No se pudo enviar",
        err?.message ||
          "Ocurrió un error al enviar el reporte. Verificá que hayas iniciado sesión.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: paleta.fondoApp }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={[
            styles.iconButton,
            {
              backgroundColor: paleta.superficie1,
              borderColor: paleta.borde,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={paleta.textoAlto} />
        </TouchableOpacity>

        <Text style={[styles.headerTitulo, { color: paleta.textoAlto }]}>
          Reportar una demora
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subtitulo, { color: paleta.textoMedio }]}>
          Desde {nombreParada} · ¿qué línea?
        </Text>

        <View style={styles.lineasSelectorRow}>
          {lineasDisponibles.map((lineaItem) => {
            const activa = lineaSeleccionada === lineaItem.id;
            return (
              <TouchableOpacity
                key={lineaItem.id}
                activeOpacity={0.8}
                onPress={() => setLineaSeleccionada(lineaItem.id)}
                style={[
                  styles.lineaBadge,
                  activa
                    ? { backgroundColor: lineaItem.color }
                    : {
                        backgroundColor: paleta.superficie1,
                        borderColor: paleta.borde,
                        borderWidth: 1,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.lineaNumero,
                    {
                      color: activa ? "#ffffff" : paleta.textoBajo,
                    },
                  ]}
                >
                  {lineaItem.numero}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.motivosContainer}>
          {opcionesMotivo.map((opcion) => {
            const isSelected = motivoSeleccionado === opcion.id;

            return (
              <TouchableOpacity
                key={opcion.id}
                activeOpacity={0.8}
                onPress={() => setMotivoSeleccionado(opcion.id)}
                style={[
                  styles.motivoCard,
                  {
                    backgroundColor: paleta.superficie1,
                    borderColor: isSelected ? paleta.acento : paleta.borde,
                  },
                ]}
              >
                <View
                  style={[
                    styles.radioCircle,
                    {
                      borderColor: isSelected
                        ? paleta.acento
                        : paleta.textoBajo,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioInnerDot,
                        { backgroundColor: paleta.acento },
                      ]}
                    />
                  )}
                </View>

                <Text
                  style={[
                    styles.motivoTexto,
                    {
                      color: isSelected ? paleta.textoAlto : paleta.textoMedio,
                    },
                  ]}
                >
                  {opcion.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          value={comentario}
          onChangeText={setComentario}
          placeholder="Comentario (opcional)"
          placeholderTextColor={paleta.textoBajo}
          style={[
            styles.comentarioInput,
            {
              backgroundColor: paleta.superficie1,
              borderColor: paleta.borde,
              color: paleta.textoAlto,
            },
          ]}
        />

        <View style={styles.fotoBotonesRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSacarFoto}
            style={[
              styles.fotoBoton,
              {
                backgroundColor: paleta.superficie1,
                borderColor: paleta.borde,
              },
            ]}
          >
            <Text style={[styles.fotoBotonTexto, { color: paleta.textoAlto }]}>
              Sacar foto
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleGaleria}
            style={[
              styles.fotoBoton,
              {
                backgroundColor: paleta.superficie1,
                borderColor: paleta.borde,
              },
            ]}
          >
            <Text style={[styles.fotoBotonTexto, { color: paleta.textoAlto }]}>
              Galería
            </Text>
          </TouchableOpacity>
        </View>

        {fotoUri && (
          <View style={styles.fotoPreviewContainer}>
            <Image source={{ uri: fotoUri }} style={styles.fotoThumbnail} />
            <TouchableOpacity
              onPress={() => setFotoUri(null)}
              style={styles.eliminarFotoBtn}
            >
              <Ionicons name="close" size={16} color="#ffffff" />
            </TouchableOpacity>
            <Text style={[styles.fotoAdjuntaTexto, { color: paleta.textoMedio }]}>
              Foto adjunta al reporte
            </Text>
          </View>
        )}
      </ScrollView>

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
          onPress={handleEnviarReporte}
          disabled={enviando}
          style={[
            styles.botonEnviar,
            { backgroundColor: paleta.acento, opacity: enviando ? 0.6 : 1 },
          ]}
        >
          <Text
            style={[
              styles.botonEnviarTexto,
              { color: paleta.textoSobreAcento },
            ]}
          >
            {enviando ? "Enviando..." : "Enviar reporte"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={camaraVisible}
        animationType="slide"
        onRequestClose={() => setCamaraVisible(false)}
      >
        <View style={styles.cameraModalContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.cameraPreview}
            facing="back"
          />

          <View style={styles.cameraTopBar}>
            <TouchableOpacity
              onPress={() => setCamaraVisible(false)}
              style={styles.cameraCloseBtn}
            >
              <Ionicons name="close" size={26} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Foto de la parada / unidad</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.cameraBottomBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCapturarFotoCamara}
              disabled={capturandoFoto}
              style={styles.shutterOuter}
            >
              {capturandoFoto ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitulo: {
    fontSize: 20,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  subtitulo: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 12,
  },
  lineasSelectorRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  lineaBadge: {
    width: 44,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  lineaNumero: {
    fontSize: 16,
    fontWeight: "700",
  },
  motivosContainer: {
    gap: 10,
    marginBottom: 16,
  },
  motivoCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 14,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  motivoTexto: {
    fontSize: 16,
    fontWeight: "600",
  },
  comentarioInput: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 14,
  },
  fotoBotonesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  fotoBoton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fotoBotonTexto: {
    fontSize: 15,
    fontWeight: "700",
  },
  fotoPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  fotoThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  eliminarFotoBtn: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 4,
  },
  fotoAdjuntaTexto: {
    fontSize: 13,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  botonEnviar: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  botonEnviarTexto: {
    fontSize: 16,
    fontWeight: "700",
  },
  cameraModalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  cameraPreview: {
    flex: 1,
  },
  cameraTopBar: {
    position: "absolute",
    top: 48,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cameraCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  cameraBottomBar: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: "#ffffff",
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffffff",
  },
});
