import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import Storage from "expo-sqlite/kv-store";

import type { Tema, Usuario } from "../types";
import {
  actualizarPerfilServicio,
  agregarLineaFavoritaServicio,
  agregarParadaFavoritaServicio,
  eliminarLineaFavoritaServicio,
  eliminarParadaFavoritaServicio,
  iniciarSesionServicio,
  obtenerPerfilServicio,
  registrarseServicio,
} from "../services/auth.service";

const CLAVE_TOKEN = "sesion.token";
const CLAVE_USUARIO = "sesion.usuario";
const CLAVE_LINEAS_FAV_LOCAL = "favoritos.lineas";
const CLAVE_PARADAS_FAV_LOCAL = "favoritos.paradas";
const CLAVE_BIOMETRIA = "seguridad.biometria";

export interface AuthContextValue {
  usuario: Usuario | null;
  restaurando: boolean;
  lineasFavoritas: string[];
  paradasFavoritas: string[];
  biometriaHabilitada: boolean;
  biometriaDisponible: boolean;
  iniciarSesion: (email: string, contrasenia: string) => Promise<void>;
  registrarse: (
    nombre: string,
    email: string,
    contrasenia: string,
  ) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  alternarLineaFavorita: (lineaId: string) => Promise<void>;
  alternarParadaFavorita: (paradaId: string) => Promise<void>;
  actualizarPreferenciasUsuario: (cambios: {
    nombre?: string;
    tema?: Tema;
    avisosActivos?: boolean;
  }) => Promise<void>;
  setBiometriaHabilitada: (activa: boolean) => Promise<void>;
  autenticarConBiometria: () => Promise<boolean>;
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

function leerListaGuardada(texto: string | null, porDefecto: string[]): string[] {
  if (!texto) return porDefecto;
  try {
    const parsed = JSON.parse(texto);
    return Array.isArray(parsed) ? parsed : porDefecto;
  } catch {
    return porDefecto;
  }
}

async function borrarSesionGuardada() {
  await Promise.all([
    SecureStore.deleteItemAsync(CLAVE_TOKEN).catch(() => {}),
    Storage.removeItem(CLAVE_USUARIO).catch(() => {}),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [restaurando, setRestaurando] = useState(true);
  const [lineasFavLocales, setLineasFavLocales] = useState<string[]>([
    "lin-05",
    "lin-14",
  ]);
  const [paradasFavLocales, setParadasFavLocales] = useState<string[]>([
    "par-101",
  ]);
  const [biometriaHabilitada, setBiometriaHabilitadaState] =
    useState<boolean>(false);
  const [biometriaDisponible, setBiometriaDisponible] =
    useState<boolean>(false);

  useEffect(() => {
    let cancelado = false;

    async function restaurar() {
      try {
        // 1. Verificar soporte de hardware biométrico
        const tieneHardware = await LocalAuthentication.hasHardwareAsync().catch(
          () => false,
        );
        const tieneRegistros = await LocalAuthentication.isEnrolledAsync().catch(
          () => false,
        );
        if (!cancelado) {
          setBiometriaDisponible(tieneHardware && tieneRegistros);
        }

        // 2. Cargar favoritos locales y configuración de biometría
        const [favLineasRaw, favParadasRaw, bioRaw] = await Promise.all([
          Storage.getItem(CLAVE_LINEAS_FAV_LOCAL).catch(() => null),
          Storage.getItem(CLAVE_PARADAS_FAV_LOCAL).catch(() => null),
          Storage.getItem(CLAVE_BIOMETRIA).catch(() => null),
        ]);

        if (!cancelado) {
          setLineasFavLocales(leerListaGuardada(favLineasRaw, ["lin-05", "lin-14"]));
          setParadasFavLocales(leerListaGuardada(favParadasRaw, ["par-101"]));
          setBiometriaHabilitadaState(bioRaw === "true");
        }

        // 3. Restaurar sesión si existe token en SecureStore y usuario en kv-store
        const token = await SecureStore.getItemAsync(CLAVE_TOKEN).catch(
          () => null,
        );
        const guardado = leerUsuarioGuardado(
          await Storage.getItem(CLAVE_USUARIO).catch(() => null),
        );

        if (token && guardado) {
          if (!cancelado) setUsuario(guardado);
          // Intentar refrescar perfil en segundo plano desde la API
          obtenerPerfilServicio()
            .then(async (res) => {
              if (!cancelado && res.datos) {
                setUsuario(res.datos);
                await Storage.setItem(
                  CLAVE_USUARIO,
                  JSON.stringify(res.datos),
                ).catch(() => {});
              }
            })
            .catch(() => {});
        } else if (token || guardado) {
          await borrarSesionGuardada();
        }
      } catch {
        // Arrancamos sin sesión ante fallo de lectura
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
        throw new Error(
          serviceResponse.error.mensaje ||
            "Error al iniciar sesión. Verifique sus credenciales.",
        );
      }

      const { datos } = serviceResponse;

      await SecureStore.setItem(CLAVE_TOKEN, datos.token);
      await Storage.setItem(CLAVE_USUARIO, JSON.stringify(datos.usuario));
      setUsuario(datos.usuario);
    },
    [],
  );

  const registrarse = useCallback(
    async (nombre: string, email: string, contrasenia: string) => {
      const serviceResponse = await registrarseServicio(
        nombre,
        email,
        contrasenia,
      );

      if ("error" in serviceResponse) {
        throw new Error(
          serviceResponse.error.mensaje ||
            "No se pudo crear la cuenta. Revisá los datos ingresados.",
        );
      }

      const { datos } = serviceResponse;

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
      setUsuario(null);
    }
  }, []);

  const lineasFavoritas = useMemo(
    () => (usuario ? usuario.lineasFavoritas : lineasFavLocales),
    [usuario, lineasFavLocales],
  );

  const paradasFavoritas = useMemo(
    () => (usuario ? usuario.paradasFavoritas : paradasFavLocales),
    [usuario, paradasFavLocales],
  );

  const alternarLineaFavorita = useCallback(
    async (lineaId: string) => {
      const yaEsFavorita = lineasFavoritas.includes(lineaId);
      const nuevaLista = yaEsFavorita
        ? lineasFavoritas.filter((id) => id !== lineaId)
        : [...lineasFavoritas, lineaId];

      if (usuario) {
        const usuarioActualizado: Usuario = {
          ...usuario,
          lineasFavoritas: nuevaLista,
        };
        setUsuario(usuarioActualizado);
        await Storage.setItem(
          CLAVE_USUARIO,
          JSON.stringify(usuarioActualizado),
        ).catch(() => {});

        try {
          if (yaEsFavorita) {
            await eliminarLineaFavoritaServicio(lineaId);
          } else {
            const res = await agregarLineaFavoritaServicio(lineaId);
            if (res.datos) {
              setUsuario(res.datos);
              await Storage.setItem(
                CLAVE_USUARIO,
                JSON.stringify(res.datos),
              ).catch(() => {});
            }
          }
        } catch {
          // Si no hay conexión, se mantiene el cambio local en el perfil cacheado
        }
      } else {
        setLineasFavLocales(nuevaLista);
        await Storage.setItem(
          CLAVE_LINEAS_FAV_LOCAL,
          JSON.stringify(nuevaLista),
        ).catch(() => {});
      }
    },
    [lineasFavoritas, usuario],
  );

  const alternarParadaFavorita = useCallback(
    async (paradaId: string) => {
      const yaEsFavorita = paradasFavoritas.includes(paradaId);
      const nuevaLista = yaEsFavorita
        ? paradasFavoritas.filter((id) => id !== paradaId)
        : [...paradasFavoritas, paradaId];

      if (usuario) {
        const usuarioActualizado: Usuario = {
          ...usuario,
          paradasFavoritas: nuevaLista,
        };
        setUsuario(usuarioActualizado);
        await Storage.setItem(
          CLAVE_USUARIO,
          JSON.stringify(usuarioActualizado),
        ).catch(() => {});

        try {
          if (yaEsFavorita) {
            await eliminarParadaFavoritaServicio(paradaId);
          } else {
            const res = await agregarParadaFavoritaServicio(paradaId);
            if (res.datos) {
              setUsuario(res.datos);
              await Storage.setItem(
                CLAVE_USUARIO,
                JSON.stringify(res.datos),
              ).catch(() => {});
            }
          }
        } catch {
          // Si no hay conexión, se conserva el cambio en el perfil local
        }
      } else {
        setParadasFavLocales(nuevaLista);
        await Storage.setItem(
          CLAVE_PARADAS_FAV_LOCAL,
          JSON.stringify(nuevaLista),
        ).catch(() => {});
      }
    },
    [paradasFavoritas, usuario],
  );

  const actualizarPreferenciasUsuario = useCallback(
    async (cambios: {
      nombre?: string;
      tema?: Tema;
      avisosActivos?: boolean;
    }) => {
      if (!usuario) return;

      const actualizado: Usuario = {
        ...usuario,
        ...cambios,
      };
      setUsuario(actualizado);
      await Storage.setItem(CLAVE_USUARIO, JSON.stringify(actualizado)).catch(
        () => {},
      );

      try {
        const res = await actualizarPerfilServicio(cambios);
        if (res.datos) {
          setUsuario(res.datos);
          await Storage.setItem(
            CLAVE_USUARIO,
            JSON.stringify(res.datos),
          ).catch(() => {});
        }
      } catch {
        // Si falla por falta de red, el cambio ya quedó persistido localmente
      }
    },
    [usuario],
  );

  const setBiometriaHabilitada = useCallback(async (activa: boolean) => {
    setBiometriaHabilitadaState(activa);
    await Storage.setItem(CLAVE_BIOMETRIA, activa ? "true" : "false").catch(
      () => {},
    );
  }, []);

  const autenticarConBiometria = useCallback(async (): Promise<boolean> => {
    try {
      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: "Ingresá con tu huella o rostro a Transporte Paraná",
        cancelLabel: "Usar contraseña",
        fallbackLabel: "Usar código del teléfono",
      });
      return resultado.success;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      restaurando,
      lineasFavoritas,
      paradasFavoritas,
      biometriaHabilitada,
      biometriaDisponible,
      iniciarSesion,
      registrarse,
      cerrarSesion,
      alternarLineaFavorita,
      alternarParadaFavorita,
      actualizarPreferenciasUsuario,
      setBiometriaHabilitada,
      autenticarConBiometria,
    }),
    [
      usuario,
      restaurando,
      lineasFavoritas,
      paradasFavoritas,
      biometriaHabilitada,
      biometriaDisponible,
      iniciarSesion,
      registrarse,
      cerrarSesion,
      alternarLineaFavorita,
      alternarParadaFavorita,
      actualizarPreferenciasUsuario,
      setBiometriaHabilitada,
      autenticarConBiometria,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
