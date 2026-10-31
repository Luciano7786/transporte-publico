import type { MotivoDemora, ReporteDeDemora, RespuestaExitosa } from "../types";
import { clienteHttp } from "./cliente";

/**
 * Obtiene los reportes de demora recientes (últimos 90 minutos) de una parada.
 */
export const obtenerReportesPorParada = (
  paradaId: string,
): Promise<RespuestaExitosa<ReporteDeDemora[]>> =>
  clienteHttp<ReporteDeDemora[]>(
    `/reportes-demora?paradaId=${encodeURIComponent(paradaId)}`,
  );

/**
 * Confirma un reporte de demora existente.
 */
export const confirmarReporte = (
  reporteId: string,
): Promise<RespuestaExitosa<ReporteDeDemora>> =>
  clienteHttp<ReporteDeDemora>(
    `/reportes-demora/${encodeURIComponent(reporteId)}/confirmaciones`,
    {
      method: "POST",
    },
  );

/**
 * Crea un nuevo reporte de demora.
 */
export const crearReporte = (nuevo: {
  id?: string;
  lineaId: string;
  paradaId: string;
  motivo: MotivoDemora;
  comentario?: string | null;
  fotoUri?: string | null;
}): Promise<RespuestaExitosa<ReporteDeDemora>> => {
  // fechaHora actual en formato ISO
  const payload: Record<string, any> = {
    lineaId: nuevo.lineaId,
    paradaId: nuevo.paradaId,
    motivo: nuevo.motivo,
    fechaHora: new Date().toISOString(),
  };

  if (nuevo.id) payload.id = nuevo.id;
  if (nuevo.comentario?.trim()) payload.comentario = nuevo.comentario.trim();
  // Sólo mandamos fotoUri si es una URL válida subida al backend
  if (nuevo.fotoUri && nuevo.fotoUri.startsWith("http")) {
    payload.fotoUri = nuevo.fotoUri;
  }

  return clienteHttp<ReporteDeDemora>("/reportes-demora", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Calcula un texto legible del tiempo transcurrido (ej: "hace 15 min").
 */
export function formatearTiempoTranscurrido(fechaIso: string): string {
  const ahora = Date.now();
  const fecha = new Date(fechaIso).getTime();
  const diffMinutos = Math.max(1, Math.round((ahora - fecha) / (1000 * 60)));

  if (diffMinutos < 60) {
    return `hace ${diffMinutos} min`;
  }
  const horas = Math.floor(diffMinutos / 60);
  return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
}
