import {
  guardarLineasEnCache,
  obtenerLineaPorIdDeCache,
  obtenerLineasDeCache,
} from "../db/database";
import type { Aviso, Linea, RespuestaExitosa } from "../types";
import { clienteHttp } from "./cliente";
import { ErrorApi } from "./error.service";

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
    if (esErrorDeConexion(error)) {
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
    if (esErrorDeConexion(error)) {
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
 */
export const obtenerAvisos = (
  estado: "vigentes" | "proximos" | "todos" = "vigentes",
  lineaId?: string,
): Promise<RespuestaExitosa<Aviso[]>> => {
  const params = new URLSearchParams();
  params.set("estado", estado);
  if (lineaId) params.set("lineaId", lineaId);

  return clienteHttp<Aviso[]>(`/avisos?${params.toString()}`);
};

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
