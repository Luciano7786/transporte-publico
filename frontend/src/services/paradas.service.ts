import {
  guardarHorariosEnCache,
  guardarParadasEnCache,
  obtenerHorariosDeCache,
  obtenerParadaPorIdDeCache,
  obtenerParadaPorQrDeCache,
  obtenerParadasDeCache,
} from "../db/database";
import { HORARIOS_MOCK } from "../mocks/horarios.mock";
import type { Horario, Parada, RespuestaExitosa, Sentido, TipoDeDia } from "../types";
import { clienteHttp } from "./cliente";
import { ErrorApi } from "./error.service";

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
 * Determina si el error recibido corresponde a un corte o falta de conexión.
 */
function esErrorDeConexion(error: unknown): boolean {
  return (
    error instanceof ErrorApi &&
    (error.codigo === "SIN_CONEXION" || error.codigo === "TIEMPO_AGOTADO")
  );
}

/**
 * Obtiene la lista de paradas.
 * Estrategia de Resiliencia: guarda en SQLite cuando hay red y sirve de la base
 * local ante desconexión o fallo de señal (SIN_CONEXION).
 */
export const obtenerParadas = async (
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

  try {
    const res = await clienteHttp<Parada[]>(`/paradas?${params.toString()}`);
    // Si trajimos el catálogo general, lo persistimos en la base local
    if (res.datos && res.datos.length > 0 && !filtros?.q && !filtros?.lineaId) {
      guardarParadasEnCache(res.datos).catch((err) =>
        console.warn("No se pudo cachear paradas en SQLite:", err),
      );
    }
    return res;
  } catch (error) {
    if (esErrorDeConexion(error)) {
      let paradas = await obtenerParadasDeCache();
      if (paradas.length > 0) {
        if (filtros?.lineaId) {
          paradas = paradas.filter((p) => p.lineaIds.includes(filtros.lineaId!));
        }
        if (filtros?.sentido) {
          paradas = paradas.filter((p) => p.sentido === filtros.sentido);
        }
        if (filtros?.q) {
          const termino = filtros.q.toLowerCase().trim();
          paradas = paradas.filter((p) => p.nombre.toLowerCase().includes(termino));
        }

        return {
          datos: paradas,
          meta: {
            total: paradas.length,
            pagina: 1,
            porPagina: paradas.length,
          },
        };
      }
    }
    throw error;
  }
};

/**
 * Obtiene el detalle de una parada por su ID (ej: "par-101").
 */
export const obtenerParadaPorId = async (
  id: string,
): Promise<RespuestaExitosa<Parada>> => {
  try {
    return await clienteHttp<Parada>(`/paradas/${encodeURIComponent(id)}`);
  } catch (error) {
    if (esErrorDeConexion(error)) {
      const paradaCache = await obtenerParadaPorIdDeCache(id);
      if (paradaCache) {
        return { datos: paradaCache, meta: null };
      }
    }
    throw error;
  }
};

/**
 * Resuelve una parada a partir de su código QR (ej: "PARANA:par-101").
 * Si no hay conexión a internet, busca en la base local por el código QR o ID.
 */
export const obtenerParadaPorQr = async (
  codigo: string,
): Promise<RespuestaExitosa<Parada>> => {
  try {
    return await clienteHttp<Parada>(`/paradas/qr/${encodeURIComponent(codigo)}`);
  } catch (error) {
    if (esErrorDeConexion(error)) {
      const paradaCache = await obtenerParadaPorQrDeCache(codigo);
      if (paradaCache) {
        return { datos: paradaCache, meta: null };
      }
    }
    throw error;
  }
};

/**
 * Obtiene los horarios de tabla para una parada (y opcionalmente una línea, sentido o tipo de día).
 * Estrategia de Resiliencia: persiste los horarios en cache_horarios y responde con ellos sin red.
 */
export const obtenerHorariosPorParada = async (
  paradaId: string,
  lineaId?: string,
  sentido?: Sentido,
  dia?: TipoDeDia,
): Promise<RespuestaExitosa<Horario[]>> => {
  const lineaKey = lineaId ?? "todas";
  const sentidoKey = sentido ?? "todos";

  try {
    const params = new URLSearchParams();
    params.set("paradaId", paradaId);
    params.set("porPagina", "1000");
    if (lineaId) params.set("lineaId", lineaId);
    if (sentido) params.set("sentido", sentido);
    if (dia) params.set("dia", dia);

    const res = await clienteHttp<Horario[]>(`/horarios?${params.toString()}`);
    if (res.datos && res.datos.length > 0 && !dia) {
      guardarHorariosEnCache(paradaId, lineaKey, sentidoKey, res.datos).catch((err) =>
        console.warn("No se pudo cachear horarios en SQLite:", err),
      );
    }
    return res;
  } catch (error) {
    if (esErrorDeConexion(error)) {
      let horariosCache = await obtenerHorariosDeCache(paradaId, lineaKey, sentidoKey);
      if (!horariosCache || horariosCache.length === 0) {
        horariosCache = HORARIOS_MOCK.filter((h) => h.paradaId === paradaId);
      }
      if (horariosCache && horariosCache.length > 0) {
        const filtrados = dia
          ? horariosCache.filter((h) => h.tipoDeDia === dia)
          : horariosCache;
        return {
          datos: filtrados,
          meta: {
            total: filtrados.length,
            pagina: 1,
            porPagina: filtrados.length,
          },
        };
      }
    }
    throw error;
  }
};

/**
 * Determina el tipo de día actual ("habil", "sabado", "domingo") según la fecha del dispositivo.
 */
export function obtenerTipoDeDiaActual(fecha = new Date()): TipoDeDia {
  const diaSemana = fecha.getDay();
  if (diaSemana === 0) return "domingo";
  if (diaSemana === 6) return "sabado";
  return "habil";
}

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
 * Calcula los próximos horarios de una línea en una parada a partir de una hora de referencia (HH:MM)
 * y opcionalmente un tipo de día ("habil", "sabado", "domingo", "feriado").
 * Si no se pasa horaReferencia, toma la hora real del reloj del dispositivo.
 */
export function calcularProximosHorarios(
  horarios: Horario[],
  lineaId: string,
  horaReferencia?: string,
  cantidad = 3,
  tipoDeDia?: TipoDeDia,
): {
  proximos: string[];
  todosDelDia: string[];
  finalizoServicio: boolean;
  primerHorarioManana?: string;
  ultimoHorarioHoy?: string;
  minutosFaltantesPrimerHorario?: number;
} {
  let filtradosPorLinea = horarios.filter((h) => h.lineaId === lineaId);

  if (tipoDeDia) {
    const porDia = filtradosPorLinea.filter((h) => h.tipoDeDia === tipoDeDia);
    // Si hay horarios cargados para ese tipo de día, los usamos; si no, caemos a los hábiles disponibles
    if (porDia.length > 0) {
      filtradosPorLinea = porDia;
    }
  }

  // Quitamos duplicados de hora y ordenamos ascendentemente
  const horasUnicas = Array.from(new Set(filtradosPorLinea.map((h) => h.hora))).sort((a, b) =>
    a.localeCompare(b),
  );

  if (horasUnicas.length === 0) {
    return { proximos: [], todosDelDia: [], finalizoServicio: false };
  }

  // Hora actual del sistema en formato HH:MM si no se especifica
  let horaRef = horaReferencia;
  if (!horaRef) {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, "0");
    const mm = String(ahora.getMinutes()).padStart(2, "0");
    horaRef = `${hh}:${mm}`;
  }

  const futuros = horasUnicas.filter((hora) => hora >= horaRef!);
  const primerHorarioManana = horasUnicas[0];
  const ultimoHorarioHoy = horasUnicas[horasUnicas.length - 1];

  if (futuros.length === 0) {
    return {
      proximos: [],
      todosDelDia: horasUnicas,
      finalizoServicio: true,
      primerHorarioManana,
      ultimoHorarioHoy,
    };
  }

  const seleccionados = futuros.slice(0, cantidad);

  // Cálculo de minutos restantes para el primero
  const [refH, refM] = horaRef.split(":").map(Number);
  const [proxH, proxM] = seleccionados[0].split(":").map(Number);
  const minutosFaltantes = proxH * 60 + proxM - (refH * 60 + refM);

  return {
    proximos: seleccionados,
    todosDelDia: horasUnicas,
    finalizoServicio: false,
    primerHorarioManana,
    ultimoHorarioHoy,
    minutosFaltantesPrimerHorario: Math.max(0, minutosFaltantes),
  };
}
