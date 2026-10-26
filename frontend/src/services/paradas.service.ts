import { paradaPorIdMock, paradasMock } from "../mocks/paradas.mock";
import { horariosPorParadaMock } from "../mocks/horarios.mock";
import type { Horario, Parada, RespuestaApi, RespuestaExitosa } from "../types";
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

export const obtenerParadas = (): Promise<RespuestaExitosa<Parada[]>> =>
  abrirRespuesta(paradasMock);

export const obtenerParadaPorId = (
  id: string,
): Promise<RespuestaExitosa<Parada>> =>
  abrirRespuesta(() => paradaPorIdMock(id));

export const obtenerHorariosPorParada = (
  paradaId: string,
): Promise<RespuestaExitosa<Horario[]>> =>
  abrirRespuesta(() => horariosPorParadaMock(paradaId));

/**
 * Calcula los próximos horarios de una línea en una parada a partir de una hora de referencia (HH:MM).
 * Si no se pasa horaReferencia, toma la hora del sistema (o 10:34 como fallback de maqueta).
 */
export function calcularProximosHorarios(
  horarios: Horario[],
  lineaId: string,
  horaReferencia?: string,
  cantidad = 3,
): {
  proximos: string[];
  finalizoServicio: boolean;
  primerHorarioManana?: string;
  minutosFaltantesPrimerHorario?: number;
} {
  const horariosLinea = horarios
    .filter((h) => h.lineaId === lineaId)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  if (horariosLinea.length === 0) {
    return { proximos: [], finalizoServicio: false };
  }

  const horaRef = horaReferencia ?? "10:34"; // hora de ejemplo de la maqueta
  const futuros = horariosLinea.filter((h) => h.hora >= horaRef);

  if (futuros.length === 0) {
    return {
      proximos: [],
      finalizoServicio: true,
      primerHorarioManana: horariosLinea[0].hora,
    };
  }

  const seleccionados = futuros.slice(0, cantidad).map((h) => h.hora);

  // Cálculo de minutos restantes para el primero
  const [refH, refM] = horaRef.split(":").map(Number);
  const [proxH, proxM] = seleccionados[0].split(":").map(Number);
  const minutosFaltantes = (proxH * 60 + proxM) - (refH * 60 + refM);

  return {
    proximos: seleccionados,
    finalizoServicio: false,
    minutosFaltantesPrimerHorario: Math.max(0, minutosFaltantes),
  };
}
