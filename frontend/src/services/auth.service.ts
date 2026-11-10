import Storage from "expo-sqlite/kv-store";
import { USUARIOSMOCK } from "../mocks/auth.mock";
import type { RespuestaApi, RespuestaExitosa, Sesion, Usuario } from "../types";
import { clienteHttp } from "./cliente";
import { ErrorApi } from "./error.service";

export type { Sesion };

const CLAVE_CUENTAS_LOCALES = "auth.cuentas_locales";

interface CuentaLocal extends Usuario {
  contrasenia: string;
  token: string;
}

const CUENTA_DEMO_CATEDRA: CuentaLocal = {
  id: "usr-01",
  nombre: "Lucía Pérez",
  email: "lucia.perez@correo.ar",
  lineasFavoritas: ["lin-05", "lin-14"],
  paradasFavoritas: ["par-101", "par-102"],
  avisosActivos: true,
  tema: "sistema",
  contrasenia: "parana2026",
  token: "token-local-lucia-perez-2026",
};

function esErrorDeRedOServidor(err: unknown): boolean {
  if (!(err instanceof ErrorApi)) return false;
  return (
    err.codigo === "SIN_CONEXION" ||
    err.codigo === "TIEMPO_AGOTADO" ||
    err.codigo === "ERROR_SERVIDOR" ||
    err.codigo === "ERROR_RESPUESTA"
  );
}

async function obtenerCuentasLocales(): Promise<CuentaLocal[]> {
  const base: CuentaLocal[] = [CUENTA_DEMO_CATEDRA, ...USUARIOSMOCK];
  try {
    const raw = await Storage.getItem(CLAVE_CUENTAS_LOCALES);
    if (!raw) return base;
    const guardadas = JSON.parse(raw) as CuentaLocal[];
    if (!Array.isArray(guardadas)) return base;
    const map = new Map<string, CuentaLocal>();
    for (const c of base) map.set(c.email.toLowerCase(), c);
    for (const c of guardadas) map.set(c.email.toLowerCase(), c);
    return Array.from(map.values());
  } catch {
    return base;
  }
}

async function guardarCuentaLocal(nueva: CuentaLocal): Promise<void> {
  try {
    const actuales = await obtenerCuentasLocales();
    const filtradas = actuales.filter(
      (c) => c.email.toLowerCase() !== nueva.email.toLowerCase(),
    );
    filtradas.push(nueva);
    await Storage.setItem(CLAVE_CUENTAS_LOCALES, JSON.stringify(filtradas));
  } catch {
    // Ignorar error de persistencia secundaria
  }
}

/**
 * Inicia sesión con email y contraseña.
 * Si el backend no está desplegado o no hay conexión, autentica contra el catálogo local
 * de cuentas registradas y cuentas semilla para que el APK funcione 100% autónomo.
 */
export const iniciarSesionServicio = async (
  email: string,
  contrasenia: string,
): Promise<RespuestaApi<Sesion>> => {
  const emailNormalizado = email.trim().toLowerCase();
  try {
    const res = await clienteHttp<Sesion>("/auth/ingreso", {
      method: "POST",
      body: JSON.stringify({
        email: emailNormalizado,
        contrasena: contrasenia,
      }),
    });

    return res;
  } catch (err: any) {
    if (esErrorDeRedOServidor(err)) {
      const cuentas = await obtenerCuentasLocales();
      const encontrada = cuentas.find(
        (u) => u.email.toLowerCase() === emailNormalizado,
      );

      if (!encontrada || encontrada.contrasenia !== contrasenia) {
        return {
          error: {
            codigo: "CREDENCIALES_INVALIDAS",
            mensaje: "Email o contraseña incorrectos.",
          },
        };
      }

      const { contrasenia: _c, token, ...usuario } = encontrada;
      return {
        datos: { token, usuario },
        meta: null,
      };
    }

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
 * Si el backend no está disponible (modo APK autónomo), crea y persiste la cuenta localmente
 * en el dispositivo para que la sesión y el reingreso biométrico funcionen sin servidor.
 */
export const registrarseServicio = async (
  nombre: string,
  email: string,
  contrasenia: string,
): Promise<RespuestaApi<Sesion>> => {
  const nombreLimpio = nombre.trim();
  const emailNormalizado = email.trim().toLowerCase();

  try {
    const res = await clienteHttp<Sesion>("/auth/registro", {
      method: "POST",
      body: JSON.stringify({
        nombre: nombreLimpio,
        email: emailNormalizado,
        contrasena: contrasenia,
      }),
    });

    return res;
  } catch (err: any) {
    if (esErrorDeRedOServidor(err)) {
      const cuentas = await obtenerCuentasLocales();
      const yaExiste = cuentas.some(
        (u) => u.email.toLowerCase() === emailNormalizado,
      );
      if (yaExiste) {
        return {
          error: {
            codigo: "EMAIL_EN_USO",
            mensaje: "Ya existe una cuenta registrada con ese correo electrónico.",
          },
        };
      }

      const nuevaCuenta: CuentaLocal = {
        id: `usr-local-${Date.now()}`,
        nombre: nombreLimpio,
        email: emailNormalizado,
        lineasFavoritas: ["lin-05", "lin-14"],
        paradasFavoritas: ["par-101"],
        avisosActivos: true,
        tema: "sistema",
        contrasenia,
        token: `token-local-${Date.now()}`,
      };

      await guardarCuentaLocal(nuevaCuenta);
      const { contrasenia: _c, token, ...usuario } = nuevaCuenta;

      return {
        datos: { token, usuario },
        meta: null,
      };
    }

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
