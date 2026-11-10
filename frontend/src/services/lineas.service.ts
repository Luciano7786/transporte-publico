import Storage from "expo-sqlite/kv-store";
import {
  guardarLineasEnCache,
  obtenerLineaPorIdDeCache,
  obtenerLineasDeCache,
} from "../db/database";
import { AVISOS_MOCK } from "../mocks/lineas.mock";
import type { Aviso, Linea, RespuestaExitosa } from "../types";
import { clienteHttp } from "./cliente";
import { ErrorApi } from "./error.service";

const CLAVE_CACHE_AVISOS = "cache.avisos.lista";
const CLAVE_CACHE_AVISOS_FECHA = "cache.avisos.fecha_iso";

/**
 * Determina si debemos usar el caché local de respaldo ante un fallo de red o del túnel.
 */
function esErrorResiliente(error: unknown): boolean {
  if (!(error instanceof ErrorApi)) return false;
  return (
    error.codigo === "SIN_CONEXION" ||
    error.codigo === "TIEMPO_AGOTADO" ||
    error.codigo === "ERROR_SERVIDOR" ||
    error.codigo === "ERROR_RESPUESTA"
  );
}

/**
 * Obtiene todas las líneas de transporte urbano de Paraná.
 * Estrategia de Resiliencia: si la red responde, refresca el caché SQLite;
 * si falla por SIN_CONEXION, devuelve los datos almacenados en SQLite.
 */
export const obtenerLineas = async (): Promise<RespuestaExitosa<Linea[]>> => {
  try {
    const res = await clienteHttp<Linea[]>("/lineas");
    if (res.datos && res.datos.length > 0) {
      guardarLineasEnCache(res.datos).catch((err) =>
        console.warn("No se pudo cachear líneas en SQLite:", err),
      );
    }
    return res;
  } catch (error) {
    if (esErrorResiliente(error)) {
      const lineasCache = await obtenerLineasDeCache();
      if (lineasCache.length > 0) {
        return {
          datos: lineasCache,
          meta: {
            total: lineasCache.length,
            pagina: 1,
            porPagina: lineasCache.length,
          },
        };
      }
    }
    throw error;
  }
};

/**
 * Obtiene el detalle de una línea por su ID (ej: "lin-05").
 * Ante pérdida de conectividad, intenta resolverla desde la tabla local cache_lineas.
 */
export const obtenerLineaPorId = async (
  id: string,
): Promise<RespuestaExitosa<Linea>> => {
  try {
    const res = await clienteHttp<Linea>(`/lineas/${encodeURIComponent(id)}`);
    return res;
  } catch (error) {
    if (esErrorResiliente(error)) {
      const lineaCache = await obtenerLineaPorIdDeCache(id);
      if (lineaCache) {
        return { datos: lineaCache, meta: null };
      }
    }
    throw error;
  }
};

/**
 * Obtiene la lista de avisos del sistema (vigentes por defecto).
 * Estrategia de Resiliencia: guarda los avisos y la fecha de actualización en caché local;
 * si no hay señal, devuelve los avisos cacheados (o los datos semilla) e informa desdeCache = true.
 */
export const obtenerAvisos = async (
  estado: "vigentes" | "proximos" | "todos" = "vigentes",
  lineaId?: string,
): Promise<RespuestaExitosa<Aviso[]> & { desdeCache?: boolean }> => {
  const params = new URLSearchParams();
  params.set("estado", estado);
  if (lineaId) params.set("lineaId", lineaId);

  try {
    const res = await clienteHttp<Aviso[]>(`/avisos?${params.toString()}`);
    if (res.datos && res.datos.length > 0 && !lineaId) {
      const ahoraIso = new Date().toISOString();
      Promise.all([
        Storage.setItem(CLAVE_CACHE_AVISOS, JSON.stringify(res.datos)),
        Storage.setItem(CLAVE_CACHE_AVISOS_FECHA, ahoraIso),
      ]).catch(() => {});
    }
    return { ...res, desdeCache: false };
  } catch (error) {
    if (esErrorResiliente(error)) {
      let listaAvisos: Aviso[] = AVISOS_MOCK;
      try {
        const guardado = await Storage.getItem(CLAVE_CACHE_AVISOS);
        if (guardado) {
          const parsed = JSON.parse(guardado);
          if (Array.isArray(parsed) && parsed.length > 0) {
            listaAvisos = parsed as Aviso[];
          }
        }
      } catch {
        // Mantiene AVISOS_MOCK como respaldo
      }

      if (lineaId) {
        listaAvisos = listaAvisos.filter((a) => a.lineaIds.includes(lineaId));
      }

      return {
        datos: listaAvisos,
        meta: {
          total: listaAvisos.length,
          pagina: 1,
          porPagina: listaAvisos.length,
        },
        desdeCache: true,
      };
    }
    throw error;
  }
};

/**
 * Obtiene la fecha ISO de la última actualización exitosa de avisos.
 */
export async function obtenerUltimaActualizacionAvisos(): Promise<string | null> {
  try {
    return await Storage.getItem(CLAVE_CACHE_AVISOS_FECHA);
  } catch {
    return null;
  }
}

/**
 * Retorna el aviso vigente (desvío o alerta) para una línea dada.
 */
export async function obtenerAvisoVigentePorLinea(
  lineaId: string,
): Promise<Aviso | null> {
  try {
    const res = await obtenerAvisos("vigentes", lineaId);
    if (!res.datos || res.datos.length === 0) return null;

    // Priorizamos desvíos sobre informativos
    const desvio = res.datos.find((a) => a.gravedad === "desvio");
    return desvio ?? res.datos[0] ?? null;
  } catch {
    return null;
  }
}
