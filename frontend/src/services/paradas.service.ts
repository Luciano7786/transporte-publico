import type { Horario, Parada, RespuestaExitosa, Sentido } from "../types";
import { clienteHttp } from "./cliente";

export interface FiltrosParadas {
  q?: string;
  lineaId?: string;
  sentido?: Sentido;
  latitud?: number;
  longitud?: number;
  radioMetros?: number;
  orden?: "nombre" | "distancia";
  porPagina?: number;
}

/**
 * Obtiene la lista de paradas.
 * Por defecto pide porPagina=1000 para cargar todas las paradas de la ciudad en memoria.
 */
export const obtenerParadas = (
  filtros?: FiltrosParadas,
): Promise<RespuestaExitosa<Parada[]>> => {
  const params = new URLSearchParams();
  params.set("porPagina", String(filtros?.porPagina ?? 1000));

  if (filtros?.q) params.set("q", filtros.q);
  if (filtros?.lineaId) params.set("lineaId", filtros.lineaId);
  if (filtros?.sentido) params.set("sentido", filtros.sentido);
  if (filtros?.latitud !== undefined) params.set("latitud", String(filtros.latitud));
  if (filtros?.longitud !== undefined) params.set("longitud", String(filtros.longitud));
  if (filtros?.radioMetros !== undefined) params.set("radioMetros", String(filtros.radioMetros));
  if (filtros?.orden) params.set("orden", filtros.orden);

  return clienteHttp<Parada[]>(`/paradas?${params.toString()}`);
};

/**
 * Obtiene el detalle de una parada por su ID (ej: "par-101").
 */
export const obtenerParadaPorId = (
  id: string,
): Promise<RespuestaExitosa<Parada>> =>
  clienteHttp<Parada>(`/paradas/${encodeURIComponent(id)}`);

/**
 * Resuelve una parada a partir de su código QR (ej: "PARANA:par-101").
 */
export const obtenerParadaPorQr = (
  codigo: string,
): Promise<RespuestaExitosa<Parada>> =>
  clienteHttp<Parada>(`/paradas/qr/${encodeURIComponent(codigo)}`);

/**
 * Obtiene los horarios de tabla para una parada (y opcionalmente una línea o sentido).
 */
export const obtenerHorariosPorParada = (
  paradaId: string,
  lineaId?: string,
  sentido?: Sentido,
): Promise<RespuestaExitosa<Horario[]>> => {
  const params = new URLSearchParams();
  params.set("paradaId", paradaId);
  params.set("porPagina", "1000");
  if (lineaId) params.set("lineaId", lineaId);
  if (sentido) params.set("sentido", sentido);

  return clienteHttp<Horario[]>(`/horarios?${params.toString()}`);
};

/**
 * Consulta en la API los próximos pasos de colectivos en una parada dada según la hora actual.
 */
export const obtenerProximosHorariosApi = (
  paradaId: string,
  cantidad = 3,
  lineaId?: string,
): Promise<RespuestaExitosa<Horario[]>> => {
  const params = new URLSearchParams();
  params.set("cantidad", String(cantidad));
  if (lineaId) params.set("lineaId", lineaId);

  return clienteHttp<Horario[]>(
    `/paradas/${encodeURIComponent(paradaId)}/proximos?${params.toString()}`,
  );
};

/**
 * Calcula los próximos horarios de una línea en una parada a partir de una hora de referencia (HH:MM).
 * Si no se pasa horaReferencia, toma la hora del sistema (o 10:34 como fallback de maqueta).
 */
export function calcularProximosHorarios(
  horarios: Horario[],
  lineaId: string,
  horaReferencia?: string,
  cantidad = 3,
): {
  proximos: string[];
  finalizoServicio: boolean;
  primerHorarioManana?: string;
  minutosFaltantesPrimerHorario?: number;
} {
  const horariosLinea = horarios
    .filter((h) => h.lineaId === lineaId)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  if (horariosLinea.length === 0) {
    return { proximos: [], finalizoServicio: false };
  }

  // Hora actual del sistema en formato HH:MM si no se especifica
  let horaRef = horaReferencia;
  if (!horaRef) {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, "0");
    const mm = String(ahora.getMinutes()).padStart(2, "0");
    horaRef = `${hh}:${mm}`;
  }

  const futuros = horariosLinea.filter((h) => h.hora >= horaRef);

  if (futuros.length === 0) {
    return {
      proximos: [],
      finalizoServicio: true,
      primerHorarioManana: horariosLinea[0].hora,
    };
  }

  const seleccionados = futuros.slice(0, cantidad).map((h) => h.hora);

  // Cálculo de minutos restantes para el primero
  const [refH, refM] = horaRef.split(":").map(Number);
  const [proxH, proxM] = seleccionados[0].split(":").map(Number);
  const minutosFaltantes = (proxH * 60 + proxM) - (refH * 60 + refM);

  return {
    proximos: seleccionados,
    finalizoServicio: false,
    minutosFaltantesPrimerHorario: Math.max(0, minutosFaltantes),
  };
}
