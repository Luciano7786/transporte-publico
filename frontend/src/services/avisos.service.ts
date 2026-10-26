import type { Aviso } from "../types";
import { obtenerAvisos } from "./lineas.service";

export type FiltroAvisos = "vigentes" | "mis_lineas" | "vencidos";

/**
 * Filtra una lista de avisos según el filtro seleccionado.
 */
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

/**
 * Formatea el rango de fechas para la cabecera de la tarjeta del aviso.
 * Ej: "14/9 al 5/10" o "Sin fecha de fin".
 */
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

/**
 * Formatea el tiempo transcurrido desde la última actualización de la lista.
 * Ej: "Actualizado hace 3 min".
 */
export function formatearTiempoActualizacion(minutosAtras = 3): string {
  if (minutosAtras <= 0) {
    return "Actualizado recién";
  }
  return `Actualizado hace ${minutosAtras} min`;
}

export { obtenerAvisos };
