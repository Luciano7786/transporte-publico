import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import Storage from "expo-sqlite/kv-store";

import type { Usuario } from "../types";
import { iniciarSesionServicio } from "../services/auth.service";

const CLAVE_TOKEN = "sesion.token";
const CLAVE_USUARIO = "sesion.usuario";

export interface AuthContextValue {
  usuario: Usuario | null;
  iniciarSesion: (email: string, contrasenia: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);


function leerUsuarioGuardado(texto: string | null): Usuario | null {
  if (!texto) return null;
  try {
    return JSON.parse(texto) as Usuario;
  } catch {
    return null;
  }
}


async function borrarSesionGuardada() {
  // Borramos las dos cosas aunque falle solo una
  await Promise.all([
    SecureStore.deleteItemAsync(CLAVE_TOKEN),
    Storage.removeItem(CLAVE_USUARIO),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [restaurando, setRestaurando] = useState(true);

  // Esto pasa apenas abrimos la app, es para ver si hay un usuario guardado
  useEffect(() => {
    let cancelado = false;

    async function restaurar() {
      try {
        const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
        const guardado = leerUsuarioGuardado(
          await Storage.getItem(CLAVE_USUARIO),
        );

        if (token && guardado) {
          if (!cancelado) setUsuario(guardado);
        } else if (token || guardado) {
          // Sesión a medias es decir falta una de las piezas, se descarta
          await borrarSesionGuardada();
        }
      } catch {
        // Si alguna de los dos falla arrancamos sin sesión
      } finally {
        if (!cancelado) setRestaurando(false);
      }
    }

    restaurar();
    return () => {
      cancelado = true;
    };
  }, []);

   const iniciarSesion = useCallback(
    async (email: string, contrasenia: string) => {
      const serviceResponse = await iniciarSesionServicio(email, contrasenia);

      if ("error" in serviceResponse) {
        return;
      }

      const { datos, meta } = serviceResponse;

      await SecureStore.setItem(CLAVE_TOKEN, datos.token);
      await Storage.setItem(CLAVE_USUARIO, JSON.stringify(datos.usuario));
      setUsuario(datos.usuario);
    },
    [],
  );

  const cerrarSesion = useCallback(async () => {
    try {
      await borrarSesionGuardada();
    } finally {
      // La pantalla queda deslogueada aunque el borrado haya fallado.
      setUsuario(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      restaurando,
      iniciarSesion,
      cerrarSesion,
    }),
    [usuario, restaurando, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

}
