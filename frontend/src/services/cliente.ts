import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../config/api";
import type { RespuestaExitosa } from "../types";
import { ErrorApi } from "./error.service";

const CLAVE_TOKEN = "sesion.token";

export interface OpcionesPeticion extends RequestInit {
  autenticado?: boolean;
}

/**
 * Cliente HTTP base para interactuar con la API NestJS.
 * - Adjunta el token Bearer automáticamente si existe.
 * - Desenvuelve el sobre `{ datos, meta }`.
 * - Traduce errores de red y errores de la API `{ error: { codigo, mensaje } }` a instancias de ErrorApi.
 */
export async function clienteHttp<T>(
  ruta: string,
  opciones: OpcionesPeticion = {},
): Promise<RespuestaExitosa<T>> {
  const url = `${API_BASE_URL}${ruta.startsWith("/") ? ruta : `/${ruta}`}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opciones.headers as Record<string, string>),
  };

  // Si hay cuerpo y no se especificó Content-Type (y no es FormData), usamos JSON
  if (
    opciones.body &&
    !(opciones.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  // Token de sesión si existe
  try {
    const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Si falla el acceso a SecureStore, continúa sin header de autorización
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      ...opciones,
      headers,
    });
  } catch (error: any) {
    throw new ErrorApi(
      "SIN_CONEXION",
      "No hay conexión con el servidor. Revisá tu señal e intentá de nuevo.",
    );
  }

  // 204 No Content (ej: eliminar favorito)
  if (respuesta.status === 204) {
    return { datos: null as T, meta: null };
  }

  let cuerpo: any;
  try {
    cuerpo = await respuesta.json();
  } catch {
    if (!respuesta.ok) {
      throw new ErrorApi(
        "ERROR_SERVIDOR",
        `El servidor respondió con código ${respuesta.status}.`,
      );
    }
    return { datos: null as T, meta: null };
  }

  if (cuerpo && typeof cuerpo === "object" && "error" in cuerpo && cuerpo.error) {
    throw new ErrorApi(
      cuerpo.error.codigo || "ERROR_API",
      cuerpo.error.mensaje || "Ocurrió un error al procesar la solicitud.",
    );
  }

  if (!respuesta.ok) {
    throw new ErrorApi(
      "ERROR_RESPUESTA",
      cuerpo?.mensaje || `Error en la solicitud (${respuesta.status}).`,
    );
  }

  return {
    datos: cuerpo.datos,
    meta: cuerpo.meta ?? null,
  };
}
