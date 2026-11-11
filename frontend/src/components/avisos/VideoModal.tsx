import Ionicons from "@expo/vector-icons/Ionicons";
import { Directory, File, Paths } from "expo-file-system";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { API_BASE_URL } from "../../config/api";
import { useThemeContext } from "../../hooks/use-theme-context";

interface VideoModalProps {
  visible: boolean;
  videoUrl: string | null;
  onClose: () => void;
}

function resolverUrlVideo(videoUrl: string | null): string {
  const baseBackend = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  const fallbackBackend = `${baseBackend}/archivos/desvio-corrientes.mp4`;

  if (!videoUrl) return fallbackBackend;

  if (videoUrl.startsWith("/")) {
    return `${baseBackend}${videoUrl}`;
  }

  if (videoUrl.includes("api.parana.gob.ar")) {
    return fallbackBackend;
  }

  return videoUrl;
}

async function obtenerOCachearVideoLocal(urlRemota: string): Promise<string> {
  if (Platform.OS === "web") return urlRemota;

  try {
    const dirCache = new Directory(Paths.cache, "videos-avisos");
    if (!dirCache.exists) {
      dirCache.create({ intermediates: true, idempotent: true });
    }

    const nombreSeguro =
      urlRemota.split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g, "_") ||
      "desvio.mp4";
    const archivoDestino = new File(dirCache, nombreSeguro);

    if (archivoDestino.exists && archivoDestino.size > 0) {
      return archivoDestino.uri;
    }

    const descargado = await File.downloadFileAsync(urlRemota, archivoDestino, {
      idempotent: true,
    });
    return descargado.uri;
  } catch {
    return urlRemota;
  }
}

export const VideoModal: React.FC<VideoModalProps> = ({
  visible,
  videoUrl,
  onClose,
}) => {
  const { paleta } = useThemeContext();
  const urlResuelta = useMemo(() => resolverUrlVideo(videoUrl), [videoUrl]);

  const [fuenteVideo, setFuenteVideo] = useState<string>(urlResuelta);
  const [usarFallbackAnimado, setUsarFallbackAnimado] = useState<boolean>(false);

  useEffect(() => {
    let cancelado = false;
    setUsarFallbackAnimado(false);
    setFuenteVideo(urlResuelta);

    if (visible) {
      obtenerOCachearVideoLocal(urlResuelta).then((uriLocal) => {
        if (!cancelado) {
          setFuenteVideo(uriLocal);
        }
      });
    }

    return () => {
      cancelado = true;
    };
  }, [visible, urlResuelta]);

  const player = useVideoPlayer(fuenteVideo, (instancia) => {
    instancia.loop = true;
    if (visible) {
      instancia.play();
    }
  });

  useEffect(() => {
    const sub = player.addListener("statusChange", (payload) => {
      if (payload.status === "error") {
        setUsarFallbackAnimado(true);
      }
    });
    return () => {
      sub.remove();
    };
  }, [player]);

  const htmlReproductor = useMemo(() => {
    const safeUrl = JSON.stringify(urlResuelta);
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, html {
      width: 100%;
      height: 100%;
      background: #0b1320;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
    }
    #fallback {
      display: none;
      width: 100%;
      height: 100%;
      padding: 16px;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
    }
    .badge-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 700;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .map-anim {
      position: relative;
      height: 110px;
      margin: 8px 0;
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(148, 163, 184, 0.25);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg { width: 92%; height: 90px; }
    .ruta-cortada { stroke: #ef4444; stroke-width: 4; stroke-dasharray: 6 6; fill: none; opacity: 0.65; }
    .ruta-desvio {
      stroke: #38bdf8;
      stroke-width: 5;
      stroke-linecap: round;
      fill: none;
      stroke-dasharray: 260;
      stroke-dashoffset: 260;
      animation: trazar 3.5s ease-in-out infinite;
    }
    @keyframes trazar {
      0% { stroke-dashoffset: 260; }
      65% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: 0; }
    }
    .footer-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #cbd5e1;
    }
  </style>
</head>
<body>
  <video id="vid" controls autoplay playsinline preload="metadata">
    <source id="srcMp4" type="video/mp4" />
  </video>

  <div id="fallback">
    <div class="badge-row">
      <span>Dirección de Transporte · Paraná</span>
      <span>Reproducción Offline · 0:20</span>
    </div>
    <div class="map-anim">
      <svg viewBox="0 0 300 90">
        <path class="ruta-cortada" d="M 20 65 L 280 65" />
        <path class="ruta-desvio" d="M 20 65 L 75 65 L 105 22 L 205 22 L 235 65 L 280 65" />
        <circle cx="20" cy="65" r="5" fill="#22c55e" />
        <circle cx="155" cy="22" r="5" fill="#f59e0b" />
        <circle cx="280" cy="65" r="5" fill="#38bdf8" />
        <text x="115" y="14" fill="#f8fafc" font-size="10" font-weight="bold">Desvío por C. Santa Fe</text>
        <text x="110" y="82" fill="#fca5a5" font-size="10">C. Corrientes (Obra)</text>
      </svg>
    </div>
    <div class="footer-bar">
      <span>Líneas 2, 7 y 9 · Parada provisoria en Santa Fe y Urquiza</span>
    </div>
  </div>

  <script>
    const video = document.getElementById("vid");
    const source = document.getElementById("srcMp4");
    const fallback = document.getElementById("fallback");
    const url = ${safeUrl};

    function mostrarFallback() {
      video.style.display = "none";
      fallback.style.display = "flex";
    }

    video.addEventListener("error", mostrarFallback, true);
    source.addEventListener("error", mostrarFallback, true);
    source.src = url;
    video.load();
    video.play().catch(() => {});
  </script>
</body>
</html>`;
  }, [urlResuelta]);

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

          <View style={[styles.playerArea, { backgroundColor: "#000000" }]}>
            {!usarFallbackAnimado && Platform.OS !== "web" ? (
              <VideoView
                player={player}
                style={styles.webviewVideo}
                contentFit="contain"
                nativeControls
              />
            ) : Platform.OS === "web" && !usarFallbackAnimado ? (
              <video
                src={fuenteVideo}
                controls
                autoPlay
                onError={() => setUsarFallbackAnimado(true)}
                style={{ width: "100%", height: "100%" } as any}
              />
            ) : (
              <WebView
                originWhitelist={["*"]}
                source={{ html: htmlReproductor }}
                style={styles.webviewVideo}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                scrollEnabled={false}
              />
            )}
          </View>

          <View style={styles.body}>
            <Text style={[styles.caption, { color: paleta.textoMedio }]}>
              Video corto (20 s) publicado por la Dirección de Transporte
              mostrando el recorrido alternativo por calle Santa Fe.
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
    height: 215,
    width: "100%",
    overflow: "hidden",
  },
  webviewVideo: {
    flex: 1,
    backgroundColor: "#000000",
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
