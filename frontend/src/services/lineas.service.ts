import type { Aviso, Linea, RespuestaExitosa } from "../types";
import { clienteHttp } from "./cliente";

/**
 * Obtiene todas las líneas de transporte urbano de Paraná.
 */
export const obtenerLineas = (): Promise<RespuestaExitosa<Linea[]>> =>
  clienteHttp<Linea[]>("/lineas");

/**
 * Obtiene el detalle de una línea por su ID (ej: "lin-05").
 */
export const obtenerLineaPorId = (
  id: string,
): Promise<RespuestaExitosa<Linea>> =>
  clienteHttp<Linea>(`/lineas/${encodeURIComponent(id)}`);

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
