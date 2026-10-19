import { avisosMock, lineasMock } from "../mocks/lineas.mock";
import type { Aviso, Linea, RespuestaApi, RespuestaExitosa } from "../types";
import { ErrorApi } from "./error.service";

async function abrirRespuesta<T>(
  pedir: () => Promise<RespuestaApi<T>>,
): Promise<RespuestaExitosa<T>> {
  let respuesta: RespuestaApi<T>;

  try {
    respuesta = await pedir();
  } catch {
    throw new ErrorApi("SIN_CONEXION",
      "No hay conexión. Revisá tu señal e intentá de nuevo.",)
  }

  if ("error" in respuesta) {
    throw new ErrorApi(respuesta.error.codigo, respuesta.error.mensaje);
  }

  return respuesta;
}

export const obtenerLineas = (): Promise<RespuestaExitosa<Linea[]>> => abrirRespuesta(lineasMock);

export const obtenerAvisos = (): Promise<RespuestaExitosa<Aviso[]>> => abrirRespuesta(avisosMock);
