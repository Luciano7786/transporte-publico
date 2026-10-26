import { iniciarSesionMock } from "../mocks/auth.mock";
import { RespuestaApi, Usuario } from "../types";

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export const iniciarSesionServicio = async (
  email: string,
  contrasenia: string,
): Promise<RespuestaApi<Sesion>> => {
  try {
    const emailNormalizado = email.trim().toLowerCase();

    const resultado = await iniciarSesionMock(emailNormalizado, contrasenia);

    if ("error" in resultado) {
      return resultado;
    }

    return {
      datos: resultado.datos,
      meta: resultado.meta,
    };
  } catch (err: any) {
    return {
      error: {
        codigo: err?.codigo || "ERROR_INESPERADO",
        mensaje:
          err?.message ||
          "Ocurrió un error inesperado al intentar iniciar sesión.",
      },
    };
  }
};
