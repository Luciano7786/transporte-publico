import { delay } from "../helper/delay";
import type { Aviso, Linea, RespuestaApi } from "../types";

// ---------------------------------------------------------------------------
// Escenarios para probar los casos feos que pide el PDF.
// Cambialo antes de cargar la pantalla, por ejemplo:
//   mockConfig.escenario = "vacio";        // lista vacía
//   mockConfig.escenario = "sin-conexion"; // error de red
// ---------------------------------------------------------------------------

export type EscenarioMock = "normal" | "vacio" | "sin-conexion";

export const mockConfig: { escenario: EscenarioMock } = { escenario: "normal" };

// Fechas relativas a "ahora", para que el aviso vigente no venza mientras
// desarrollás. toISOString() devuelve la hora con zona UTC ("...Z").
const enDias = (dias: number) =>
  new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

// ---------------------------------------------------------------------------
// Líneas
// Los nombres y colores son inventados, salvo la línea 5 (del PDF).
// `trazado` y `paradaIds` quedan vacíos: la lista no los usa. Se completan
// cuando se arme la pantalla de una línea.
// ---------------------------------------------------------------------------

const MORENO = "Transporte Mariano Moreno";
const ERSA = "Ersa Urbana";

const linea = (
  numero: string,
  a: string,
  b: string,
  color: string,
  empresa: string,
): Linea => ({
  id: `lin-${numero.padStart(2, "0")}`,
  numero,
  nombre: `${a} — ${b}`,
  color,
  empresa,
  recorridos: [
    { sentido: "ida", destino: `hacia ${a}`, trazado: [], paradaIds: [] },
    { sentido: "vuelta", destino: `hacia ${b}`, trazado: [], paradaIds: [] },
  ],
  activa: true,
});

export const LINEAS_MOCK: Linea[] = [
  linea("1", "Hernandarias", "Centro", "#BE185D", MORENO),
  linea("2", "Centro", "Villa Sarmiento", "#7C3AAD", ERSA),
  linea("3", "Centro", "Thompson", "#0369A1", MORENO),
  linea("4", "Terminal", "Centro", "#15803D", ERSA),
  linea("5", "Puerto Viejo", "San Agustín", "#1B6CA8", MORENO),
  linea("6", "Centro", "Villa Urquiza", "#B91C1C", ERSA),
  {
    id: "lin-07",
    numero: "7",
    nombre: "Centro — Bajada Grande",
    color: "#0F766E",
    empresa: MORENO,
    activa: true,
    recorridos: [
      {
        sentido: "ida",
        destino: "a Bajada Grande",
        trazado: [
          { latitud: -31.732, longitud: -60.529 },
          { latitud: -31.7335, longitud: -60.527 },
          { latitud: -31.7345, longitud: -60.5255 },
          { latitud: -31.736, longitud: -60.523 },
          { latitud: -31.74, longitud: -60.515 },
          { latitud: -31.748, longitud: -60.495 },
        ],
        paradaIds: ["par-102", "par-103", "par-104", "par-109"],
      },
      {
        sentido: "vuelta",
        destino: "al Centro",
        trazado: [
          { latitud: -31.748, longitud: -60.495 },
          { latitud: -31.743, longitud: -60.512 },
          { latitud: -31.737, longitud: -60.522 },
          { latitud: -31.732, longitud: -60.529 },
        ],
        paradaIds: ["par-109", "par-104", "par-102"],
      },
    ],
  },
  linea("8", "Centro", "Lomas del Mirador", "#A16207", ERSA),
  linea("9", "Puerto Nuevo", "Centro", "#9A3412", MORENO),
  linea("10", "Centro", "Paraná XIV", "#4338CA", ERSA),
  linea("11", "Centro", "Cinco Esquinas", "#86198F", MORENO),
  linea("12", "Centro", "Barrio Belgrano", "#0E7490", ERSA),
  linea("13", "Terminal", "San Martín", "#475569", MORENO),
  linea("14", "San Agustín", "Bajada Grande", "#B45309", MORENO),
];

// ---------------------------------------------------------------------------
// Avisos
//  - avi-088: desvío vigente, con video y recorrido alternativo (líneas 2, 7, 9)
//  - avi-089: informativo vigente, sin fecha de fin y sin video (línea 14)
//  - avi-070: ya venció (línea 3): esa línea debe verse como normal
//  - avi-090: todavía no empezó (línea 6): esa línea también se ve normal
// ---------------------------------------------------------------------------

export const AVISOS_MOCK: Aviso[] = [
  {
    id: "avi-088",
    titulo: "Desvío por obra en calle Corrientes",
    detalle: "Las líneas 2, 7 y 9 desvían por Santa Fe.",
    lineaIds: ["lin-02", "lin-07", "lin-09"],
    desde: enDias(-2),
    hasta: enDias(19),
    gravedad: "desvio",
    trazadoAlternativo: [
      { latitud: -31.7345, longitud: -60.523 },
      { latitud: -31.7352, longitud: -60.5218 },
      { latitud: -31.7361, longitud: -60.5205 },
    ],
    videoUrl: "https://api.parana.gob.ar/v/desvio-corrientes.mp4",
  },
  {
    id: "avi-089",
    titulo: "Cambio de horario los sábados",
    detalle: "La línea 14 sale 10 minutos más tarde desde las 6:00.",
    lineaIds: ["lin-14"],
    desde: enDias(-10),
    hasta: null,
    gravedad: "informativo",
    trazadoAlternativo: null,
    videoUrl: null,
  },
  {
    id: "avi-070",
    titulo: "Desvío por obra en calle Urquiza",
    detalle: "Terminó la obra: la línea 3 vuelve a su recorrido habitual.",
    lineaIds: ["lin-03"],
    desde: enDias(-30),
    hasta: enDias(-1),
    gravedad: "desvio",
    trazadoAlternativo: null,
    videoUrl: null,
  },
  {
    id: "avi-090",
    titulo: "Suspensión por jornada de paro",
    detalle: "La línea 6 no circula ese día.",
    lineaIds: ["lin-06"],
    desde: enDias(3),
    hasta: enDias(4),
    gravedad: "suspension",
    trazadoAlternativo: null,
    videoUrl: null,
  },
];

// ---------------------------------------------------------------------------
// "Servidor" simulado
// ---------------------------------------------------------------------------

const responderLista = async <T>(
  datos: T[],
  demora: number,
): Promise<RespuestaApi<T[]>> => {
  // Simula la demora de la red, para poder ver el estado de carga.
  await delay(demora);

  // Sin conexión no llega ninguna respuesta: fetch rechaza la promesa.
  if (mockConfig.escenario === "sin-conexion") {
    return {
      error: {
        codigo: "SIN_CONEXION",
        mensaje: "No hay conexión. Revisá tu señal e intentá de nuevo.",
      },
    };
  } 

  const lista = mockConfig.escenario === "vacio" ? [] : datos;
  return {
    datos: lista,
    meta: { total: lista.length, pagina: 1, porPagina: 20 },
  };
};

export const lineasMock = () => responderLista(LINEAS_MOCK, 500);
export const avisosMock = () => responderLista(AVISOS_MOCK, 400);

export const lineaPorIdMock = async (
  id: string,
  demora = 250,
): Promise<RespuestaApi<Linea>> => {
  await delay(demora);

  if (mockConfig.escenario === "sin-conexion") {
    return {
      error: {
        codigo: "SIN_CONEXION",
        mensaje: "No hay conexión. Revisá tu señal e intentá de nuevo.",
      },
    };
  }

  const encontrada = LINEAS_MOCK.find((l) => l.id === id);
  if (!encontrada) {
    return {
      error: {
        codigo: "LINEA_NO_ENCONTRADA",
        mensaje: "No existe esa línea.",
      },
    };
  }

  return {
    datos: encontrada,
    meta: { total: 1, pagina: 1, porPagina: 1 },
  };
};
