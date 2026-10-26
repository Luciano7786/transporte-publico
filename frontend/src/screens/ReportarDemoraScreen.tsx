import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";
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
import { crearReporte } from "../services/reportes.service";
import type { MotivoDemora } from "../types";

export function ReportarDemoraScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { paleta } = useThemeContext();

  const paradaId = route.params?.paradaId ?? "par-101";
  const nombreParada = route.params?.nombreParada ?? "Alameda y Urquiza";

  // Estados del formulario
  const [lineaSeleccionada, setLineaSeleccionada] = useState<string>("lin-05");
  const [motivoSeleccionado, setMotivoSeleccionado] =
    useState<MotivoDemora>("no_paso");
  const [comentario, setComentario] = useState<string>("");
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);

  const opcionesMotivo: Array<{ id: MotivoDemora; label: string }> = [
    { id: "no_paso", label: "No pasó" },
    { id: "paso_lleno", label: "Pasó lleno y no paró" },
    { id: "demorado", label: "Viene demorado" },
    { id: "unidad_rota", label: "Unidad rota" },
    { id: "calle_cortada", label: "Calle cortada" },
  ];

  const handleSacarFoto = () => {
    // Foto de demostración para emuladores y dispositivos
    setFotoUri("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400");
    Alert.alert("Cámara", "Foto adjuntada al reporte.");
  };

  const handleGaleria = () => {
    setFotoUri("https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400");
    Alert.alert("Galería", "Imagen seleccionada.");
  };

  const handleEnviarReporte = async () => {
    try {
      setEnviando(true);
      await crearReporte({
        lineaId: lineaSeleccionada,
        paradaId,
        motivo: motivoSeleccionado,
        comentario: comentario.trim() || null,
        fotoUri,
      });

      Alert.alert(
        "Reporte enviado",
        "Tu aviso fue registrado. Los demás pasajeros que esperan en la parada podrán verlo y confirmarlo.",
        [
          {
            text: "Aceptar",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        "No se pudo enviar",
        err?.message || "Ocurrió un error al enviar el reporte. Verificá que hayas iniciado sesión.",
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
          {/* Línea 5 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setLineaSeleccionada("lin-05")}
            style={[
              styles.lineaBadge,
              lineaSeleccionada === "lin-05"
                ? { backgroundColor: "#1B6CA8" }
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
                  color:
                    lineaSeleccionada === "lin-05"
                      ? "#ffffff"
                      : paleta.textoBajo,
                },
              ]}
            >
              5
            </Text>
          </TouchableOpacity>

          {/* Línea 14 */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setLineaSeleccionada("lin-14")}
            style={[
              styles.lineaBadge,
              lineaSeleccionada === "lin-14"
                ? { backgroundColor: "#B45309" }
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
                  color:
                    lineaSeleccionada === "lin-14"
                      ? "#ffffff"
                      : paleta.textoBajo,
                },
              ]}
            >
              14
            </Text>
          </TouchableOpacity>
        </View>

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

        {/* Vista previa de foto adjunta si existe */}
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
});
