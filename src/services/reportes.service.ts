import {
  confirmarReporteMock,
  crearReporteMock,
  reportesPorParadaMock,
} from "../mocks/reportes.mock";
import type { MotivoDemora, ReporteDeDemora, RespuestaApi, RespuestaExitosa } from "../types";
import { ErrorApi } from "./error.service";

async function abrirRespuesta<T>(
  pedir: () => Promise<RespuestaApi<T>>,
): Promise<RespuestaExitosa<T>> {
  let respuesta: RespuestaApi<T>;

  try {
    respuesta = await pedir();
  } catch {
    throw new ErrorApi(
      "SIN_CONEXION",
      "No hay conexión. Revisá tu señal e intentá de nuevo.",
    );
  }

  if ("error" in respuesta) {
    throw new ErrorApi(respuesta.error.codigo, respuesta.error.mensaje);
  }

  return respuesta;
}

export const obtenerReportesPorParada = (
  paradaId: string,
): Promise<RespuestaExitosa<ReporteDeDemora[]>> =>
  abrirRespuesta(() => reportesPorParadaMock(paradaId));

export const confirmarReporte = (
  reporteId: string,
): Promise<RespuestaExitosa<ReporteDeDemora>> =>
  abrirRespuesta(() => confirmarReporteMock(reporteId));

export const crearReporte = (nuevo: {
  lineaId: string;
  paradaId: string;
  motivo: MotivoDemora;
  comentario: string | null;
  fotoUri: string | null;
}): Promise<RespuestaExitosa<ReporteDeDemora>> =>
  abrirRespuesta(() => crearReporteMock(nuevo));

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
