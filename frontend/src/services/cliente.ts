// src/services/cliente.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../config/api";
import type { RespuestaExitosa } from "../types";
import { ErrorApi } from "./error.service";

const CLAVE_TOKEN = "sesion.token";
const TIEMPO_MAXIMO_MS = 15000;

export interface OpcionesPeticion extends RequestInit {
  autenticado?: boolean;
}

interface CuerpoConError {
  error: { codigo?: string; mensaje?: string };
}

interface CuerpoExitoso<T> {
  datos: T;
  meta?: RespuestaExitosa<T>["meta"] | null;
}

function tieneError(cuerpo: unknown): cuerpo is CuerpoConError {
  return (
    typeof cuerpo === "object" &&
    cuerpo !== null &&
    "error" in cuerpo &&
    Boolean((cuerpo as { error?: unknown }).error)
  );
}

function errorDeLaApi(cuerpo: CuerpoConError): ErrorApi {
  return new ErrorApi(
    cuerpo.error.codigo || "ERROR_API",
    cuerpo.error.mensaje || "Ocurrió un error al procesar la solicitud.",
  );
}

// Convierte cualquier cosa que falle en un ErrorApi. Es el único lugar donde
// se traducen los errores, así las pantallas siempre reciben el mismo tipo.
function traducirError(error: unknown): ErrorApi {
  if (error instanceof ErrorApi) return error;

  if (axios.isCancel(error)) {
    return new ErrorApi("PETICION_CANCELADA", "La solicitud fue cancelada.");
  }

  if (!axios.isAxiosError(error)) {
    return new ErrorApi("ERROR_DESCONOCIDO", "Ocurrió un error inesperado.");
  }

  // El servidor no llegó a responder: no hay conexión o se agotó el tiempo.
  if (!error.response) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new ErrorApi(
        "TIEMPO_AGOTADO",
        "El servidor tardó demasiado en responder. Intentá de nuevo.",
      );
    }
    return new ErrorApi(
      "SIN_CONEXION",
      "No hay conexión con el servidor. Revisá tu señal e intentá de nuevo.",
    );
  }

  const { status, data } = error.response;

  // La API respondió con { error: { codigo, mensaje } }.
  if (tieneError(data)) return errorDeLaApi(data);

  // Respondió un JSON, pero sin la forma del error de la API.
  if (typeof data === "object" && data !== null) {
    const mensaje = (data as { mensaje?: string }).mensaje;
    return new ErrorApi(
      "ERROR_RESPUESTA",
      mensaje || `Error en la solicitud (${status}).`,
    );
  }

  // Respondió algo que no es JSON (por ejemplo, una página de error).
  return new ErrorApi(
    "ERROR_SERVIDOR",
    `El servidor respondió con código ${status}.`,
  );
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIEMPO_MAXIMO_MS,
  headers: { Accept: "application/json" },
});

// Antes de cada petición: adjunta el token de sesión si existe.
http.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Si falla el acceso a SecureStore, sigue sin header de autorización.
  }
  return config;
});

// Después de cada petición: todo lo que no salga bien termina como ErrorApi.
http.interceptors.response.use(
  (respuesta) => {
    // Por si la API devuelve un error dentro de una respuesta 2xx.
    if (tieneError(respuesta.data)) throw errorDeLaApi(respuesta.data);
    return respuesta;
  },
  (error: unknown) => {
    throw traducirError(error);
  },
);

/**
 * Cliente HTTP base para interactuar con la API NestJS (usa axios).
 * - Adjunta el token Bearer automáticamente si existe.
 * - Desenvuelve el sobre `{ datos, meta }`.
 * - Traduce errores de red y errores de la API `{ error: { codigo, mensaje } }`
 *   a instancias de ErrorApi.
 * Mantiene la misma firma que la versión con fetch: quien lo usa no cambia.
 */
export async function clienteHttp<T>(
  ruta: string,
  opciones: OpcionesPeticion = {},
): Promise<RespuestaExitosa<T>> {
  const headers: Record<string, string> = {
    ...(opciones.headers as Record<string, string>),
  };
  const cuerpoPeticion = opciones.body;

  if (cuerpoPeticion instanceof FormData) {
    // Con fetch NO se pone este header, pero con axios en React Native sí:
    // sin él, la subida de archivos suele fallar con "Network Error" en
    // Android. React Native agrega el boundary por su cuenta.
    if (!headers["Content-Type"]) headers["Content-Type"] = "multipart/form-data";
  } else if (cuerpoPeticion && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const respuesta = await http.request<unknown>({
    url: ruta,
    method: opciones.method ?? "GET",
    headers,
    data: cuerpoPeticion,
    signal: opciones.signal ?? undefined,
  });

  const cuerpo = respuesta.data;

  // 204 No Content (ej: eliminar favorito) o respuesta sin cuerpo JSON.
  if (
    respuesta.status === 204 ||
    typeof cuerpo !== "object" ||
    cuerpo === null
  ) {
    return { datos: null as T, meta: null };
  }

  const { datos, meta } = cuerpo as CuerpoExitoso<T>;
  return { datos, meta: meta ?? null };
}