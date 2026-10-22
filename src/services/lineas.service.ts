import { avisosMock, lineaPorIdMock, lineasMock } from "../mocks/lineas.mock";
import type { Aviso, Linea, RespuestaApi, RespuestaExitosa } from "../types";
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

export const obtenerLineas = (): Promise<RespuestaExitosa<Linea[]>> =>
  abrirRespuesta(lineasMock);

export const obtenerAvisos = (): Promise<RespuestaExitosa<Aviso[]>> =>
  abrirRespuesta(avisosMock);

export const obtenerLineaPorId = (
  id: string,
): Promise<RespuestaExitosa<Linea>> =>
  abrirRespuesta(() => lineaPorIdMock(id));

/**
 * Retorna el aviso vigente (desvío o alerta) para una línea dada.
 */
export async function obtenerAvisoVigentePorLinea(
  lineaId: string,
): Promise<Aviso | null> {
  try {
    const res = await obtenerAvisos();
    const ahora = new Date().toISOString();

    const vigentes = res.datos.filter((aviso) => {
      if (!aviso.lineaIds.includes(lineaId)) return false;
      const empezo = aviso.desde <= ahora;
      const noVencio = !aviso.hasta || aviso.hasta >= ahora;
      return empezo && noVencio;
    });

    // Priorizamos desvíos sobre informativos
    const desvio = vigentes.find((a) => a.gravedad === "desvio");
    return desvio ?? vigentes[0] ?? null;
  } catch {
    return null;
  }
}

