import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeContext } from "../../hooks/use-theme-context";

interface VideoModalProps {
  visible: boolean;
  videoUrl: string | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  visible,
  videoUrl,
  onClose,
}) => {
  const { paleta } = useThemeContext();
  const [reproduciendo, setReproduciendo] = useState(true);

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: paleta.superficie1,
              borderColor: paleta.borde,
            },
          ]}
        >
          {/* Header del Modal */}
          <View style={styles.header}>
            <Text
              style={[styles.titulo, { color: paleta.textoAlto }]}
              numberOfLines={1}
            >
              Explicación del Desvío
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={24} color={paleta.textoMedio} />
            </TouchableOpacity>
          </View>

          {/* Área de Reproducción de Video */}
          <View style={[styles.playerArea, { backgroundColor: "#000000" }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setReproduciendo((prev) => !prev)}
              style={styles.centerPlayButton}
            >
              <Ionicons
                name={reproduciendo ? "pause-circle" : "play-circle"}
                size={54}
                color="rgba(255, 255, 255, 0.85)"
              />
            </TouchableOpacity>

            {/* Barra de progreso simulada */}
            <View style={styles.controlsBar}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { backgroundColor: paleta.acento }]} />
              </View>
              <Text style={styles.timerText}>0:08 / 0:20</Text>
            </View>
          </View>

          {/* Descripción explicativa */}
          <View style={styles.body}>
            <Text style={[styles.caption, { color: paleta.textoMedio }]}>
              Video corto (20s) grabado por la Dirección de Transporte mostrando
              el recorrido alternativo por calle Santa Fe.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={[styles.botonCerrar, { backgroundColor: paleta.acento }]}
            >
              <Text
                style={[
                  styles.botonCerrarTexto,
                  { color: paleta.textoSobreAcento },
                ]}
              >
                Entendido
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  playerArea: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerPlayButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  controlsBar: {
    position: "absolute",
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    width: "40%",
    height: "100%",
  },
  timerText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  body: {
    padding: 18,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  botonCerrar: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  botonCerrarTexto: {
    fontSize: 15,
    fontWeight: "700",
  },
});
