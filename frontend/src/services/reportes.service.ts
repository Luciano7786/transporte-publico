import { Directory, File, Paths } from "expo-file-system";
import * as Network from "expo-network";
import { Platform } from "react-native";
import {
  encolarReporteOffline,
  limpiarReportesSincronizados,
  marcarReporteSincronizado,
  obtenerReportesPendientes,
} from "../db/database";
import { REPORTES_MOCK } from "../mocks/reportes.mock";
import type { MotivoDemora, ReporteDeDemora, RespuestaExitosa } from "../types";
import { clienteHttp } from "./cliente";
import { ErrorApi } from "./error.service";

export interface ArchivoSubido {
  url: string;
  tipo: "imagen" | "audio" | "video";
  bytes: number;
}

export function guardarFotoReporteEnDispositivo(uriOrigen: string): string {
  if (Platform.OS === "web" || !uriOrigen) return uriOrigen;

  try {
    const dirFotos = new Directory(Paths.document, "reportes-fotos");
    if (!dirFotos.exists) {
      dirFotos.create({ intermediates: true, idempotent: true });
    }

    const archivoOrigen = new File(uriOrigen);
    if (!archivoOrigen.exists) {
      return uriOrigen;
    }

    if (uriOrigen.includes("reportes-fotos")) {
      return archivoOrigen.uri;
    }

    const ext =
      uriOrigen
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";
    const extensionSegura = ext === "png" || ext === "webp" ? ext : "jpg";
    const archivoDestino = new File(
      dirFotos,
      `evidencia-${Date.now()}.${extensionSegura}`,
    );

    archivoOrigen.copy(archivoDestino);
    return archivoDestino.uri;
  } catch {
    return uriOrigen;
  }
}

export async function subirArchivoImagen(
  uriLocal: string,
): Promise<RespuestaExitosa<ArchivoSubido>> {
  const uriPersistida = guardarFotoReporteEnDispositivo(uriLocal);
  const formData = new FormData();
  const extension = uriPersistida.split(".").pop()?.toLowerCase() || "jpg";
  const mime =
    extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : "image/jpeg";
  const nombreArchivo = `reporte-${Date.now()}.${extension === "png" ? "png" : "jpg"}`;

  if (Platform.OS === "web") {
    const resp = await fetch(uriPersistida);
    const blob = await resp.blob();
    formData.append("archivo", blob, nombreArchivo);
  } else {
    const archivoLocal = new File(uriPersistida);
    const uriParaSubir = archivoLocal.exists ? archivoLocal.uri : uriPersistida;
    formData.append("archivo", {
      uri: uriParaSubir,
      name: nombreArchivo,
      type: mime,
    } as any);
  }

  return clienteHttp<ArchivoSubido>("/archivos", {
    method: "POST",
    body: formData,
  });
}

function esErrorDeConexion(error: unknown): boolean {
  if (!(error instanceof ErrorApi)) return false;
  return (
    error.codigo === "SIN_CONEXION" ||
    error.codigo === "TIEMPO_AGOTADO" ||
    error.codigo === "ERROR_SERVIDOR" ||
    error.codigo === "ERROR_RESPUESTA"
  );
}

export const obtenerReportesPorParada = async (
  paradaId: string,
): Promise<RespuestaExitosa<ReporteDeDemora[]>> => {
  try {
    return await clienteHttp<ReporteDeDemora[]>(
      `/reportes-demora?paradaId=${encodeURIComponent(paradaId)}`,
    );
  } catch (error) {
    if (esErrorDeConexion(error)) {
      const pendientes = await obtenerReportesPendientes();
      const localesParada: ReporteDeDemora[] = pendientes
        .filter((r) => r.paradaId === paradaId)
        .map((r) => ({
          id: r.id,
          lineaId: r.lineaId,
          paradaId: r.paradaId,
          usuarioId: "yo",
          motivo: r.motivo,
          comentario: r.comentario,
          fotoUri: r.fotoUri ?? null,
          confirmaciones: 1,
          fechaHora: r.fechaHora,
          sincronizado: false,
        }));

      const mocksParada = REPORTES_MOCK.filter((r) => r.paradaId === paradaId);
      const combinados = [...localesParada, ...mocksParada];

      return {
        datos: combinados,
        meta: {
          total: combinados.length,
          pagina: 1,
          porPagina: Math.max(1, combinados.length),
        },
      };
    }
    throw error;
  }
};

export const confirmarReporte = async (
  reporteId: string,
): Promise<RespuestaExitosa<ReporteDeDemora>> => {
  try {
    return await clienteHttp<ReporteDeDemora>(
      `/reportes-demora/${encodeURIComponent(reporteId)}/confirmaciones`,
      {
        method: "POST",
      },
    );
  } catch (error) {
    if (esErrorDeConexion(error)) {
      const enMock = REPORTES_MOCK.find((r) => r.id === reporteId);
      if (enMock) {
        enMock.confirmaciones += 1;
        return { datos: { ...enMock }, meta: null };
      }

      const pendientes = await obtenerReportesPendientes();
      const local = pendientes.find((r) => r.id === reporteId);
      if (local) {
        return {
          datos: {
            id: local.id,
            lineaId: local.lineaId,
            paradaId: local.paradaId,
            usuarioId: "yo",
            motivo: local.motivo,
            comentario: local.comentario,
            fotoUri: local.fotoUri ?? null,
            confirmaciones: 2,
            fechaHora: local.fechaHora,
            sincronizado: false,
          },
          meta: null,
        };
      }
    }
    throw error;
  }
};

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

  const payload: Record<string, any> = {
    lineaId: nuevo.lineaId,
    paradaId: nuevo.paradaId,
    motivo: nuevo.motivo,
    fechaHora,
  };

  if (nuevo.id) payload.id = nuevo.id;
  if (nuevo.comentario?.trim()) payload.comentario = nuevo.comentario.trim();

  if (nuevo.fotoUri) {
    if (
      nuevo.fotoUri.startsWith("file:") ||
      nuevo.fotoUri.startsWith("content:") ||
      nuevo.fotoUri.startsWith("data:") ||
      nuevo.fotoUri.startsWith("blob:")
    ) {
      try {
        const resArchivo = await subirArchivoImagen(nuevo.fotoUri);
        if (resArchivo.datos?.url) {
          payload.fotoUri = resArchivo.datos.url;
        }
      } catch (err) {
        if (esErrorDeConexion(err)) {
          throw err;
        }
        console.warn("No se pudo subir la foto adjunta, se enviará el reporte de texto:", err);
      }
    } else if (
      nuevo.fotoUri.startsWith("http") &&
      nuevo.fotoUri.includes("/archivos/")
    ) {
      payload.fotoUri = nuevo.fotoUri;
    }
  }

  try {
    const res = await clienteHttp<ReporteDeDemora>("/reportes-demora", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  } catch (error) {
    if (esErrorDeConexion(error)) {
      await encolarReporteOffline({
        id: reporteId,
        lineaId: nuevo.lineaId,
        paradaId: nuevo.paradaId,
        motivo: nuevo.motivo,
        comentario: nuevo.comentario ?? null,
        fotoUri: nuevo.fotoUri ?? null,
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
          fotoUri: nuevo.fotoUri ?? null,
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
      let fotoUrlRemota: string | undefined;
      if (rep.fotoUri) {
        try {
          const resArchivo = await subirArchivoImagen(rep.fotoUri);
          if (resArchivo.datos?.url) {
            fotoUrlRemota = resArchivo.datos.url;
          }
        } catch {
        }
      }

      await clienteHttp<ReporteDeDemora>("/reportes-demora", {
        method: "POST",
        body: JSON.stringify({
          lineaId: rep.lineaId,
          paradaId: rep.paradaId,
          motivo: rep.motivo,
          comentario: rep.comentario,
          ...(fotoUrlRemota ? { fotoUri: fotoUrlRemota } : {}),
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

export function iniciarEscuchaRedYSincronizacion(): () => void {
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
