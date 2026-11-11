import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../config/api";
import type { RespuestaExitosa } from "../types";
import { ErrorApi } from "./error.service";

const CLAVE_TOKEN = "sesion.token";
const TIEMPO_MAXIMO_MS = 4000;

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

function traducirError(error: unknown): ErrorApi {
  if (error instanceof ErrorApi) return error;

  if (axios.isCancel(error)) {
    return new ErrorApi("PETICION_CANCELADA", "La solicitud fue cancelada.");
  }

  if (!axios.isAxiosError(error)) {
    return new ErrorApi("ERROR_DESCONOCIDO", "Ocurrió un error inesperado.");
  }

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

  if (tieneError(data)) return errorDeLaApi(data);

  if (typeof data === "object" && data !== null) {
    const mensaje = (data as { mensaje?: string }).mensaje;
    return new ErrorApi(
      "ERROR_RESPUESTA",
      mensaje || `Error en la solicitud (${status}).`,
    );
  }

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

http.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
  }
  return config;
});

http.interceptors.response.use(
  (respuesta) => {
    if (tieneError(respuesta.data)) throw errorDeLaApi(respuesta.data);
    return respuesta;
  },
  (error: unknown) => {
    throw traducirError(error);
  },
);

export async function clienteHttp<T>(
  ruta: string,
  opciones: OpcionesPeticion = {},
): Promise<RespuestaExitosa<T>> {
  const headers: Record<string, string> = {
    ...(opciones.headers as Record<string, string>),
  };
  const cuerpoPeticion = opciones.body;

  if (cuerpoPeticion instanceof FormData) {
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