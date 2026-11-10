import React, { useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

export interface PuntoMapa {
  id: string;
  latitud: number;
  longitud: number;
  titulo?: string;
  color?: string;
  /** "usuario" dibuja el punto azul de "Tu ubicación"; "parada" un círculo de color. */
  tipo?: "usuario" | "parada";
}

export interface LineaMapa {
  puntos: { latitud: number; longitud: number }[];
  color: string;
  punteada?: boolean;
}

interface MapaLeafletProps {
  centro: { latitud: number; longitud: number };
  zoom?: number;
  puntos?: PuntoMapa[];
  lineas?: LineaMapa[];
  oscuro?: boolean;
  /** Se llama con el id del punto tocado. */
  onPressPunto?: (id: string) => void;
}

/**
 * Mapa Leaflet + OpenStreetMap dentro de un WebView.
 * No depende de Google Maps ni de ninguna API key.
 */
export const MapaLeaflet: React.FC<MapaLeafletProps> = ({
  centro,
  zoom = 15,
  puntos = [],
  lineas = [],
  oscuro = false,
  onPressPunto,
}) => {
  const ref = useRef<WebView>(null);

  // El HTML se regenera solo cuando cambian los datos del mapa.
  const html = useMemo(() => {
    const datos = JSON.stringify({ centro, zoom, puntos, lineas, oscuro });
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #e9e5dc; }
  .oscuro .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9); }
  .usuario { width: 34px; height: 34px; border-radius: 17px; background: rgba(56,138,224,0.3);
             display: flex; align-items: center; justify-content: center; }
  .usuario > div { width: 14px; height: 14px; border-radius: 7px; background: #2563eb;
                   border: 2.5px solid #fff; box-sizing: border-box; }
  .parada { width: 18px; height: 18px; border-radius: 9px; border: 2.5px solid #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.45); box-sizing: border-box; }
  #aviso { position: absolute; bottom: 8px; left: 8px; right: 8px; z-index: 1000; display: none;
           background: rgba(0,0,0,0.75); color: #fff; font: 12px sans-serif; padding: 6px 10px; border-radius: 8px; }
</style>
</head>
<body>
<div id="map"></div>
<div id="aviso">No se pudo cargar el mapa. Revisá la conexión a internet.</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var d = ${datos};
  if (typeof L === "undefined") {
    document.getElementById("aviso").style.display = "block";
  } else {
    if (d.oscuro) document.body.classList.add("oscuro");
    var map = L.map("map", { zoomControl: false, attributionControl: false })
      .setView([d.centro.latitud, d.centro.longitud], d.zoom);
    var capa = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    var fallos = 0;
    capa.on("tileerror", function () {
      fallos++;
      if (fallos > 3) document.getElementById("aviso").style.display = "block";
    });
    capa.on("tileload", function () { document.getElementById("aviso").style.display = "none"; });

    d.lineas.forEach(function (l) {
      L.polyline(l.puntos.map(function (p) { return [p.latitud, p.longitud]; }), {
        color: l.color, weight: 4, dashArray: l.punteada ? "6 6" : null
      }).addTo(map);
    });

    d.puntos.forEach(function (p) {
      var html = p.tipo === "usuario"
        ? '<div class="usuario"><div></div></div>'
        : '<div class="parada" style="background:' + (p.color || "#CBD5E1") + '"></div>';
      var size = p.tipo === "usuario" ? 34 : 18;
      var m = L.marker([p.latitud, p.longitud], {
        icon: L.divIcon({ html: html, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
      }).addTo(map);
      if (p.titulo) m.bindTooltip(p.titulo);
      m.on("click", function () {
        window.ReactNativeWebView.postMessage(JSON.stringify({ id: p.id }));
      });
    });
  }
</script>
</body>
</html>`;
  }, [centro.latitud, centro.longitud, zoom, puntos, lineas, oscuro]);

  const alMensaje = (e: WebViewMessageEvent) => {
    try {
      const { id } = JSON.parse(e.nativeEvent.data) as { id: string };
      onPressPunto?.(id);
    } catch {
      // mensaje inválido: se ignora
    }
  };

  return (
    <View style={styles.contenedor}>
      <WebView
        ref={ref}
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://localhost" }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        onMessage={alMensaje}
        scrollEnabled={false}
        nestedScrollEnabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1, overflow: "hidden" },
  webview: { flex: 1, backgroundColor: "transparent" },
});

