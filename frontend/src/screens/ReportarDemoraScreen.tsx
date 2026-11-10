import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeContext } from "../hooks/use-theme-context";
import { apiService } from "../services/api";
import { obtenerLineas } from "../services/lineas.service";
import { obtenerParadaPorId } from "../services/paradas.service";
import { crearReporte } from "../services/reportes.service";
import type { Linea, MotivoDemora } from "../types";

export function ReportarDemoraScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { paleta } = useThemeContext();

  const paradaId = route.params?.paradaId ?? "par-101";
  const nombreParada = route.params?.nombreParada ?? "Alameda y Urquiza";
  const idsLineaIniciales: string[] = Array.isArray(route.params?.lineaIds)
    ? route.params.lineaIds
    : [];

  // Estados del formulario
  const [lineaIds, setLineaIds] = useState<string[]>(idsLineaIniciales);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [cargandoLineas, setCargandoLineas] = useState(true);
  const [errorLineas, setErrorLineas] = useState<string | null>(null);
  const [lineaSeleccionada, setLineaSeleccionada] = useState<string>(
    idsLineaIniciales[0] ?? "",
  );
  const [motivoSeleccionado, setMotivoSeleccionado] =
    useState<MotivoDemora>("no_paso");
  const [comentario, setComentario] = useState<string>("");
  const [fotoSeleccionada, setFotoSeleccionada] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);

  useEffect(() => {
    let activo = true;

    async function cargarLineasDeParada() {
      setCargandoLineas(true);
      setErrorLineas(null);
      const [resultadoParada, resultadoLineas] = await Promise.allSettled([
        obtenerParadaPorId(paradaId),
        obtenerLineas(),
      ]);

      if (!activo) return;

      const problemas: string[] = [];
      if (resultadoParada.status === "fulfilled") {
        setLineaIds(resultadoParada.value.datos.lineaIds);
      } else {
        console.warn("No se pudieron cargar las líneas de la parada:", resultadoParada.reason);
        problemas.push("No se pudo actualizar la información de la parada.");
      }

      if (resultadoLineas.status === "fulfilled") {
        setLineas(resultadoLineas.value.datos);
      } else {
        console.warn("No se pudo cargar el catálogo de líneas:", resultadoLineas.reason);
        problemas.push(
          resultadoLineas.reason instanceof Error
            ? resultadoLineas.reason.message
            : "No se pudo cargar el catálogo de líneas.",
        );
      }

      setErrorLineas(problemas.length > 0 ? problemas.join(" ") : null);
      setCargandoLineas(false);
    }

    cargarLineasDeParada();
    return () => {
      activo = false;
    };
  }, [paradaId]);

  useEffect(() => {
    if (!lineaIds.includes(lineaSeleccionada)) {
      setLineaSeleccionada(lineaIds[0] ?? "");
    }
  }, [lineaIds, lineaSeleccionada]);

  const lineasDisponibles = lineaIds.map((id) => {
    const linea = lineas.find((item) => item.id === id);
    return {
      id,
      numero: linea?.numero ?? id.replace(/^lin-0?/, ""),
      color: linea?.color ?? paleta.acento,
    };
  });

  const opcionesMotivo: Array<{ id: MotivoDemora; label: string }> = [
    { id: "no_paso", label: "No pasó" },
    { id: "paso_lleno", label: "Pasó lleno y no paró" },
    { id: "demorado", label: "Viene demorado" },
    { id: "unidad_rota", label: "Unidad rota" },
    { id: "calle_cortada", label: "Calle cortada" },
  ];

  const seleccionarFoto = async (origen: "camara" | "galeria") => {
    try {
      if (origen === "camara") {
        const permiso = await ImagePicker.requestCameraPermissionsAsync();
        if (!permiso.granted) {
          Alert.alert(
            "Permiso requerido",
            "Habilitá el acceso a la cámara para tomar una foto.",
          );
          return;
        }
      }

      const resultado =
        origen === "camara"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              quality: 0.8,
            });

      if (!resultado.canceled && resultado.assets[0]) {
        setFotoSeleccionada(resultado.assets[0]);
      }
    } catch (error) {
      console.warn("No se pudo abrir la cámara o galería:", error);
      Alert.alert(
        "No se pudo seleccionar la foto",
        error instanceof Error
          ? error.message
          : "Volvé a intentarlo desde la cámara o galería.",
      );
    }
  };

  const handleEnviarReporte = async () => {
    if (!lineaIds.includes(lineaSeleccionada)) {
      Alert.alert("Seleccioná una línea", "Elegí una de las líneas de esta parada.");
      return;
    }

    try {
      setEnviando(true);
      let fotoUri: string | null = null;
      if (fotoSeleccionada) {
        const archivo = await apiService.subirArchivo({
          uri: fotoSeleccionada.uri,
          name: fotoSeleccionada.fileName ?? `reporte-${Date.now()}.jpg`,
          type: fotoSeleccionada.mimeType ?? "image/jpeg",
        });
        fotoUri = archivo.url;
      }

      const res = await crearReporte({
        lineaId: lineaSeleccionada,
        paradaId,
        motivo: motivoSeleccionado,
        comentario: comentario.trim() || null,
        fotoUri,
      });

      const esOffline = res.datos && !res.datos.sincronizado;

      Alert.alert(
        esOffline ? "Guardado sin conexión" : "Reporte enviado",
        esOffline
          ? "No hay señal de internet. Tu reporte se guardó localmente y se enviará automáticamente al recuperar conexión."
          : "Tu aviso fue registrado. Los demás pasajeros que esperan en la parada podrán verlo y confirmarlo.",
        [
          {
            text: "Aceptar",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (err: unknown) {
      Alert.alert(
        "No se pudo enviar",
        `${err instanceof Error ? err.message : "Ocurrió un error inesperado."}${
          fotoSeleccionada
            ? "\n\nLa foto sigue adjunta. Verificá la conexión o quitá la foto para guardar el reporte sin conexión."
            : ""
        }`,
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: paleta.fondoApp }]}
    >
      {/* 1. Header */}
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
        {/* 2. Subtítulo y selector de línea */}
        <Text style={[styles.subtitulo, { color: paleta.textoMedio }]}>
          Desde {nombreParada} · ¿qué línea?
        </Text>

        <View style={styles.lineasSelectorRow}>
          {lineasDisponibles.map((linea) => {
            const seleccionada = lineaSeleccionada === linea.id;
            return (
              <TouchableOpacity
                key={linea.id}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected: seleccionada }}
                onPress={() => setLineaSeleccionada(linea.id)}
                style={[
                  styles.lineaBadge,
                  seleccionada
                    ? { backgroundColor: linea.color }
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
                      color: seleccionada ? "#ffffff" : paleta.textoBajo,
                    },
                  ]}
                >
                  {linea.numero}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {cargandoLineas && (
          <Text style={[styles.avisoLineas, { color: paleta.textoMedio }]}>
            Cargando líneas de la parada…
          </Text>
        )}
        {!cargandoLineas && lineasDisponibles.length === 0 && (
          <Text style={[styles.avisoLineas, { color: paleta.textoMedio }]}>
            Esta parada no tiene líneas disponibles para reportar.
          </Text>
        )}
        {errorLineas && (
          <Text style={[styles.avisoLineas, { color: paleta.textoMedio }]}>
            {errorLineas}
          </Text>
        )}

        {/* 3. Lista de Motivos con Radio Buttons */}
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
                {/* Radio Button */}
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

                {/* Texto del motivo */}
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

        {/* 4. Campo de Comentario Opcional */}
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

        {/* 5. Acciones de Foto */}
        <View style={styles.fotoBotonesRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => seleccionarFoto("camara")}
            disabled={enviando}
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
            onPress={() => seleccionarFoto("galeria")}
            disabled={enviando}
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

        {/* Vista previa de foto adjunta si existe */}
        {fotoSeleccionada && (
          <View style={styles.fotoPreviewContainer}>
            <Image
              source={{ uri: fotoSeleccionada.uri }}
              style={styles.fotoThumbnail}
            />
            <TouchableOpacity
              onPress={() => setFotoSeleccionada(null)}
              disabled={enviando}
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

      {/* 6. Botón Inferior: Enviar reporte */}
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
          disabled={
            enviando || cargandoLineas || !lineasDisponibles.length
          }
          style={[
            styles.botonEnviar,
            {
              backgroundColor: paleta.acento,
              opacity:
                enviando || cargandoLineas || !lineasDisponibles.length
                  ? 0.6
                  : 1,
            },
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
    minWidth: 44,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  lineaNumero: {
    fontSize: 16,
    fontWeight: "700",
  },
  avisoLineas: {
    fontSize: 13,
    marginBottom: 14,
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
});
