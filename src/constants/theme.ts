import { Platform } from "react-native";

import type { Gravedad } from "../types";

export type ColorKeys = {
  [K in keyof Paleta]: Paleta[K] extends string ? K : never;
}[keyof Paleta];

export interface Paleta {
  // Fondos y superficies
  fondoApp: string;
  superficie1: string; // cards, barra de tabs
  superficie2: string; // chips, inputs, mapa
  superficie3: string; // etiquetas sobre imagen
  borde: string;

  // Texto e íconos
  textoAlto: string; // texto principal
  textoMedio: string; // texto secundario
  textoBajo: string; // texto terciario / deshabilitado

  // Acento: botón primario, chip y tab activos, enlaces
  acento: string;
  textoSobreAcento: string; // texto sobre un fondo de acento sólido

  // Estados (banners, insignias de "funcionando normal", errores)
  exito: string;
  advertencia: string;
  error: string;
  informacion: string;

  // Fijo (no cambia entre temas). El color de fondo de la insignia de cada
  // línea viene de la API (Linea.color); el número va siempre en blanco.
  textoSobreLinea: string;

  // Colores de los tres tipos de aviso. Mismo shape para los dos temas.
  gravedadAviso: Record<Gravedad, { fondo: string; borde: string; texto: string }>;
}

export const Colors: Record<"light" | "dark", Paleta> = {
  dark: {
    fondoApp: "#0e1114",
    superficie1: "#171b20",
    superficie2: "#1f252b",
    superficie3: "#262d35",
    borde: "#2a3139",

    textoAlto: "#eef1f3",
    textoMedio: "#aab3bb",
    textoBajo: "#7d8791",

    acento: "#6cb4f5",
    textoSobreAcento: "#06223d",

    exito: "#4cc884",
    advertencia: "#f5a524",
    error: "#ff7070",
    informacion: "#6cb4f5",

    textoSobreLinea: "#ffffff",

    gravedadAviso: {
      informativo: {
        fondo: "rgba(108,180,245,.15)",
        borde: "rgba(108,180,245,.45)",
        texto: "#6cb4f5",
      },
      desvio: {
        fondo: "rgba(245,165,36,.15)",
        borde: "rgba(245,165,36,.45)",
        texto: "#f5a524",
      },
      suspension: {
        fondo: "rgba(255,112,112,.15)",
        borde: "rgba(255,112,112,.45)",
        texto: "#ff7070",
      },
    },
  },

  light: {
    fondoApp: "#ffffff",
    superficie1: "#f4f6f3",
    superficie2: "#e9ede8",
    superficie3: "#dfe4de",
    borde: "#d9dfd9",

    textoAlto: "#13181b",
    textoMedio: "#46505a",
    textoBajo: "#68727c",

    acento: "#0b62bd",
    textoSobreAcento: "#ffffff",

    exito: "#17803d",
    advertencia: "#9a5700",
    error: "#c2262e",
    informacion: "#0b62bd",

    textoSobreLinea: "#ffffff",

    gravedadAviso: {
      informativo: {
        fondo: "rgba(11,98,189,.15)",
        borde: "rgba(11,98,189,.45)",
        texto: "#0b62bd",
      },
      desvio: {
        fondo: "rgba(154,87,0,.15)",
        borde: "rgba(154,87,0,.45)",
        texto: "#9a5700",
      },
      suspension: {
        fondo: "rgba(194,38,46,.15)",
        borde: "rgba(194,38,46,.45)",
        texto: "#c2262e",
      },
    },
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});