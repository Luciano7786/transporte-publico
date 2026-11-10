import * as Network from "expo-network";
import {
  encolarReporteOffline,
  limpiarReportesSincronizados,
  marcarReporteSincronizado,
  obtenerReportesPendientes,
} from "../db/database";
import type { MotivoDemora, ReporteDeDemora, RespuestaExitosa } from "../types";
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
 * Estrategia de Resiliencia: si no hay internet (SIN_CONEXION), guarda el reporte
 * en la tabla local cola_reportes_offline de SQLite para sincronizarlo al recuperar señal.
 */
export const crearReporte = async (nuevo: {
  id?: string;
  lineaId: string;
  paradaId: string;
  motivo: MotivoDemora;
  comentario?: string | null;
  fotoUri?: string | null;
}): Promise<RespuestaExitosa<ReporteDeDemora>> => {
  const reporteId = nuevo.id ?? `rep-off-${Date.now()}`;
  const fechaHora = new Date().toISOString();
  const fotoUri = nuevo.fotoUri?.startsWith("http") ? nuevo.fotoUri : null;

  const payload: Record<string, any> = {
    lineaId: nuevo.lineaId,
    paradaId: nuevo.paradaId,
    motivo: nuevo.motivo,
    fechaHora,
  };

  if (nuevo.id) payload.id = nuevo.id;
  if (nuevo.comentario?.trim()) payload.comentario = nuevo.comentario.trim();
  if (fotoUri) payload.fotoUri = fotoUri;

  try {
    const res = await clienteHttp<ReporteDeDemora>("/reportes-demora", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  } catch (error) {
    if (esErrorDeConexion(error)) {
      // Guardar en cola local offline
      await encolarReporteOffline({
        id: reporteId,
        lineaId: nuevo.lineaId,
        paradaId: nuevo.paradaId,
        motivo: nuevo.motivo,
        comentario: nuevo.comentario ?? null,
        fotoUri,
        fechaHora,
      });

      return {
        datos: {
          id: reporteId,
          lineaId: nuevo.lineaId,
          paradaId: nuevo.paradaId,
          usuarioId: "yo",
          motivo: nuevo.motivo,
          comentario: nuevo.comentario ?? null,
          fotoUri,
          confirmaciones: 0,
          fechaHora,
          sincronizado: false,
        },
        meta: null,
      };
    }
    throw error;
  }
};

/**
 * Sincroniza los reportes pendientes almacenados en SQLite enviándolos a la API.
 */
export async function sincronizarReportesOffline(): Promise<{
  sincronizados: number;
  fallidos: number;
}> {
  const pendientes = await obtenerReportesPendientes();
  if (pendientes.length === 0) return { sincronizados: 0, fallidos: 0 };

  let sincronizados = 0;
  let fallidos = 0;

  for (const rep of pendientes) {
    try {
      await clienteHttp<ReporteDeDemora>("/reportes-demora", {
        method: "POST",
        body: JSON.stringify({
          lineaId: rep.lineaId,
          paradaId: rep.paradaId,
          motivo: rep.motivo,
          comentario: rep.comentario,
          ...(rep.fotoUri ? { fotoUri: rep.fotoUri } : {}),
          fechaHora: rep.fechaHora,
        }),
      });

      await marcarReporteSincronizado(rep.id);
      sincronizados++;
    } catch {
      fallidos++;
    }
  }

  if (sincronizados > 0) {
    await limpiarReportesSincronizados();
  }

  return { sincronizados, fallidos };
}

/**
 * Inicia la escucha automática de estado de red con expo-network para reenviar
 * reportes pendientes en cuanto se recupera la conexión a internet.
 */
export function iniciarEscuchaRedYSincronizacion(): () => void {
  // Intentar sincronizar al arrancar por si quedaron reportes previos
  sincronizarReportesOffline().catch(() => {});

  const sub = Network.addNetworkStateListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      sincronizarReportesOffline().catch((err) =>
        console.warn("Error en sincronización automática offline:", err),
      );
    }
  });

  return () => {
    sub.remove();
  };
}

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
