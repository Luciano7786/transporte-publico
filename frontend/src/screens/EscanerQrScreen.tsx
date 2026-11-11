import Ionicons from "@expo/vector-icons/Ionicons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeContext } from "../hooks/use-theme-context";
import { ErrorApi } from "../services/error.service";
import { obtenerParadaPorQr } from "../services/paradas.service";
import { interpretarCodigoQr } from "../helper/qr"

type Estado =
  | { tipo: "escaneando" }
  | { tipo: "buscando" }
  | { tipo: "error"; mensaje: string };

export function EscanerQrScreen() {
  const navigation = useNavigation<any>();
  const enfocada = useIsFocused();
  const { paleta } = useThemeContext();
  const [permiso, pedirPermiso] = useCameraPermissions();

  const [estado, setEstado] = useState<Estado>({ tipo: "escaneando" });
  const [linterna, setLinterna] = useState(false);

  const bloqueado = useRef(false);

  const abrirParada = useCallback(
    (paradaId: string) => {
      navigation.replace("ParadaDetalle", { paradaId });
    },
    [navigation],
  );

  const alEscanear = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      if (bloqueado.current) return;
      bloqueado.current = true;
      setEstado({ tipo: "buscando" });

      const qr = interpretarCodigoQr(data);
      if (!qr) {
        setEstado({
          tipo: "error",
          mensaje: "Este código QR no es de una parada de Paraná.",
        });
        return;
      }

      try {
        const res = await obtenerParadaPorQr(qr.codigo);
        abrirParada(res.datos?.id ?? qr.paradaId);
      } catch (err) {
        if (err instanceof ErrorApi && err.codigo === "SIN_CONEXION") {
          abrirParada(qr.paradaId);
          return;
        }

        let mensaje = "No pudimos identificar la parada. Intentá de nuevo.";
        if (err instanceof ErrorApi) {
          mensaje =
            err.codigo === "PARADA_NO_ENCONTRADA"
              ? "Ese código no corresponde a ninguna parada."
              : err.message;
        }
        setEstado({ tipo: "error", mensaje });
      }
    },
    [abrirParada],
  );

  const reintentar = () => {
    bloqueado.current = false;
    setEstado({ tipo: "escaneando" });
  };

  if (!permiso) {
    return (
      <View style={[styles.centro, { backgroundColor: paleta.fondoApp }]} />
    );
  }

  if (!permiso.granted) {
    return (
      <SafeAreaView
        style={[styles.centro, { backgroundColor: paleta.fondoApp }]}
      >
        <Ionicons name="camera-outline" size={44} color={paleta.textoMedio} />
        <Text style={[styles.tituloPermiso, { color: paleta.textoAlto }]}>
          Necesitamos usar la cámara
        </Text>
        <Text style={[styles.textoPermiso, { color: paleta.textoMedio }]}>
          Es para leer el código QR del cartel de la parada. Si preferís no dar
          el permiso, podés volver y buscar la parada por nombre.
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            permiso.canAskAgain ? pedirPermiso() : Linking.openSettings()
          }
          style={[styles.botonPrincipal, { backgroundColor: paleta.acento }]}
        >
          <Text
            style={[styles.textoBoton, { color: paleta.textoSobreAcento }]}
          >
            {permiso.canAskAgain ? "Permitir cámara" : "Abrir ajustes"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("MainTabs");
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.textoBoton, { color: paleta.textoMedio }]}>
            Volver
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.contenedor}>
      {enfocada && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={linterna}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={estado.tipo === "escaneando" ? alEscanear : undefined}
        />
      )}

      <SafeAreaView style={styles.superposicion} pointerEvents="box-none">
        <View style={styles.barraSuperior}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("MainTabs");
              }
            }}
            style={styles.botonRedondo}
            accessibilityRole="button"
            accessibilityLabel="Cerrar el escáner"
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setLinterna((prendida) => !prendida)}
            style={styles.botonRedondo}
            accessibilityRole="button"
            accessibilityLabel={linterna ? "Apagar la linterna" : "Prender la linterna"}
          >
            <Ionicons
              name={linterna ? "flash" : "flash-off"}
              size={22}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.zonaMarco} pointerEvents="none">
          <View style={[styles.marco, { borderColor: paleta.acento }]} />
        </View>

        <View style={styles.panel}>
          {estado.tipo === "escaneando" && (
            <Text style={styles.textoPanel}>
              Apuntá al código QR del cartel de la parada
            </Text>
          )}

          {estado.tipo === "buscando" && (
            <>
              <ActivityIndicator color="#ffffff" />
              <Text style={styles.textoPanel}>Buscando la parada…</Text>
            </>
          )}

          {estado.tipo === "error" && (
            <>
              <Text style={styles.textoPanel}>{estado.mensaje}</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={reintentar}
                style={[styles.botonPrincipal, { backgroundColor: paleta.acento }]}
              >
                <Text
                  style={[styles.textoBoton, { color: paleta.textoSobreAcento }]}
                >
                  Escanear de nuevo
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#000000",
  },
  superposicion: {
    ...StyleSheet.absoluteFill,
  },
  barraSuperior: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  botonRedondo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  zonaMarco: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  marco: {
    width: 240,
    height: 240,
    borderRadius: 24,
    borderWidth: 3,
  },
  panel: {
    margin: 16,
    padding: 16,
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  textoPanel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 14,
  },
  tituloPermiso: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  textoPermiso: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  botonPrincipal: {
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  textoBoton: {
    fontSize: 15,
    fontWeight: "700",
  },
});
