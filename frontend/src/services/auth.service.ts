import type { RespuestaApi, RespuestaExitosa, Sesion, Usuario } from "../types";
import { clienteHttp } from "./cliente";
import { ErrorApi } from "./error.service";

export type { Sesion };

/**
 * Inicia sesión con email y contraseña.
 */
export const iniciarSesionServicio = async (
  email: string,
  contrasenia: string,
): Promise<RespuestaApi<Sesion>> => {
  try {
    const emailNormalizado = email.trim().toLowerCase();
    const res = await clienteHttp<Sesion>("/auth/ingreso", {
      method: "POST",
      body: JSON.stringify({
        email: emailNormalizado,
        contrasena: contrasenia,
      }),
    });

    return res;
  } catch (err: any) {
    return {
      error: {
        codigo: err instanceof ErrorApi ? err.codigo : "ERROR_AUTENTICACION",
        mensaje:
          err instanceof Error
            ? err.message
            : "No se pudo iniciar sesión. Verificá tus credenciales.",
      },
    };
  }
};

/**
 * Registra un nuevo usuario pasajero.
 */
export const registrarseServicio = async (
  nombre: string,
  email: string,
  contrasenia: string,
): Promise<RespuestaApi<Sesion>> => {
  try {
    const res = await clienteHttp<Sesion>("/auth/registro", {
      method: "POST",
      body: JSON.stringify({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        contrasena: contrasenia,
      }),
    });

    return res;
  } catch (err: any) {
    return {
      error: {
        codigo: err instanceof ErrorApi ? err.codigo : "ERROR_REGISTRO",
        mensaje:
          err instanceof Error
            ? err.message
            : "No se pudo registrar la cuenta. Revisá los datos ingresados.",
      },
    };
  }
};

/**
 * Obtiene el perfil del usuario autenticado actual.
 */
export const obtenerPerfilServicio = (): Promise<RespuestaExitosa<Usuario>> =>
  clienteHttp<Usuario>("/yo");

/**
 * Modifica preferencias del usuario (nombre, tema, avisosActivos).
 */
export const actualizarPerfilServicio = (cambios: {
  nombre?: string;
  tema?: "claro" | "oscuro" | "sistema";
  avisosActivos?: boolean;
}): Promise<RespuestaExitosa<Usuario>> =>
  clienteHttp<Usuario>("/yo", {
    method: "PATCH",
    body: JSON.stringify(cambios),
  });

/**
 * Agrega una línea a los favoritos del usuario.
 */
export const agregarLineaFavoritaServicio = (
  lineaId: string,
): Promise<RespuestaExitosa<Usuario>> =>
  clienteHttp<Usuario>(`/yo/lineas-favoritas/${encodeURIComponent(lineaId)}`, {
    method: "PUT",
  });

/**
 * Elimina una línea de los favoritos del usuario.
 */
export const eliminarLineaFavoritaServicio = (
  lineaId: string,
): Promise<RespuestaExitosa<void>> =>
  clienteHttp<void>(`/yo/lineas-favoritas/${encodeURIComponent(lineaId)}`, {
    method: "DELETE",
  });

/**
 * Agrega una parada a los favoritos del usuario.
 */
export const agregarParadaFavoritaServicio = (
  paradaId: string,
): Promise<RespuestaExitosa<Usuario>> =>
  clienteHttp<Usuario>(`/yo/paradas-favoritas/${encodeURIComponent(paradaId)}`, {
    method: "PUT",
  });

/**
 * Elimina una parada de los favoritos del usuario.
 */
export const eliminarParadaFavoritaServicio = (
  paradaId: string,
): Promise<RespuestaExitosa<void>> =>
  clienteHttp<void>(`/yo/paradas-favoritas/${encodeURIComponent(paradaId)}`, {
    method: "DELETE",
  });
