import type { Aviso } from "../types";
import { obtenerAvisos, obtenerUltimaActualizacionAvisos } from "./lineas.service";

export type FiltroAvisos = "vigentes" | "mis_lineas" | "vencidos";

export function filtrarAvisos(
  avisos: Aviso[],
  filtro: FiltroAvisos,
  lineasFavoritas: string[] = ["lin-05", "lin-14"],
  fechaReferencia: string = new Date().toISOString(),
): Aviso[] {
  return avisos.filter((aviso) => {
    const yaInicio = aviso.desde <= fechaReferencia;
    const yaVencio = Boolean(aviso.hasta && aviso.hasta < fechaReferencia);

    if (filtro === "vigentes") {
      return yaInicio && !yaVencio;
    }

    if (filtro === "mis_lineas") {
      const esVigente = yaInicio && !yaVencio;
      const afectaFavoritas = aviso.lineaIds.some((id) =>
        lineasFavoritas.includes(id),
      );
      return esVigente && afectaFavoritas;
    }

    if (filtro === "vencidos") {
      return yaVencio;
    }

    return true;
  });
}

export function formatearRangoFechas(
  desdeIso: string,
  hastaIso: string | null,
): string {
  if (!hastaIso) {
    return "Sin fecha de fin";
  }

  const dDesde = new Date(desdeIso);
  const dHasta = new Date(hastaIso);

  const diaDesde = dDesde.getDate();
  const mesDesde = dDesde.getMonth() + 1;

  const diaHasta = dHasta.getDate();
  const mesHasta = dHasta.getMonth() + 1;

  return `${diaDesde}/${mesDesde} al ${diaHasta}/${mesHasta}`;
}

export function formatearTiempoActualizacion(
  minutosAtras = 0,
  desdeCache = false,
): string {
  const prefijo = desdeCache ? "Datos sin conexión · " : "";
  if (minutosAtras <= 0) {
    return `${prefijo}Actualizado recién`;
  }
  if (minutosAtras >= 60) {
    const horas = Math.floor(minutosAtras / 60);
    return `${prefijo}Actualizado hace ${horas} h`;
  }
  return `${prefijo}Actualizado hace ${minutosAtras} min`;
}

export { obtenerAvisos, obtenerUltimaActualizacionAvisos };
