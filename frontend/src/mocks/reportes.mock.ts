import { delay } from "../helper/delay";
import type { MotivoDemora, ReporteDeDemora, RespuestaApi } from "../types";
import { mockConfig } from "./lineas.mock";

// Fechas relativas a "ahora"
const minutosAtras = (minutos: number) =>
  new Date(Date.now() - minutos * 60 * 1000).toISOString();

export const REPORTES_MOCK: ReporteDeDemora[] = [
  {
    id: "rep-3390",
    lineaId: "lin-05",
    paradaId: "par-101",
    usuarioId: "usr-320",
    motivo: "demorado",
    comentario: "El coche 14 viene demorado en el centro",
    fotoUri: null,
    confirmaciones: 2,
    fechaHora: minutosAtras(15),
    sincronizado: true,
  },
];

export const reportesPorParadaMock = async (
  paradaId: string,
  demora = 300,
): Promise<RespuestaApi<ReporteDeDemora[]>> => {
  await delay(demora);

  if (mockConfig.escenario === "sin-conexion") {
    return {
      error: {
        codigo: "SIN_CONEXION",
        mensaje: "No hay conexión. Revisá tu señal e intentá de nuevo.",
      },
    };
  }

  const reportes = REPORTES_MOCK.filter((r) => r.paradaId === paradaId);
  return {
    datos: reportes,
    meta: { total: reportes.length, pagina: 1, porPagina: 50 },
  };
};

export const confirmarReporteMock = async (
  reporteId: string,
  demora = 250,
): Promise<RespuestaApi<ReporteDeDemora>> => {
  await delay(demora);

  if (mockConfig.escenario === "sin-conexion") {
    return {
      error: {
        codigo: "SIN_CONEXION",
        mensaje: "No hay conexión. Revisá tu señal e intentá de nuevo.",
      },
    };
  }

  const reporte = REPORTES_MOCK.find((r) => r.id === reporteId);
  if (!reporte) {
    return {
      error: {
        codigo: "REPORTE_NO_ENCONTRADO",
        mensaje: "No se encontró el reporte a confirmar.",
      },
    };
  }

  reporte.confirmaciones += 1;

  return {
    datos: { ...reporte },
    meta: { total: 1, pagina: 1, porPagina: 1 },
  };
};

export const crearReporteMock = async (
  nuevo: {
    lineaId: string;
    paradaId: string;
    motivo: MotivoDemora;
    comentario: string | null;
    fotoUri: string | null;
  },
  demora = 350,
): Promise<RespuestaApi<ReporteDeDemora>> => {
  await delay(demora);

  if (mockConfig.escenario === "sin-conexion") {
    return {
      error: {
        codigo: "SIN_CONEXION",
        mensaje:
          "No hay conexión. El reporte se guardará localmente para enviarse cuando haya señal.",
      },
    };
  }

  const reporteCreado: ReporteDeDemora = {
    id: `rep-${Math.floor(1000 + Math.random() * 9000)}`,
    lineaId: nuevo.lineaId,
    paradaId: nuevo.paradaId,
    usuarioId: "usr-320",
    motivo: nuevo.motivo,
    comentario: nuevo.comentario,
    fotoUri: nuevo.fotoUri,
    confirmaciones: 1,
    fechaHora: new Date().toISOString(),
    sincronizado: true,
  };

  REPORTES_MOCK.unshift(reporteCreado);

  return {
    datos: reporteCreado,
    meta: { total: 1, pagina: 1, porPagina: 1 },
  };
};
