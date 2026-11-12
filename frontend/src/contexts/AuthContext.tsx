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
  actualizarUsuarioEnCuentasLocales,
  agregarLineaFavoritaServicio,
  agregarParadaFavoritaServicio,
  eliminarLineaFavoritaServicio,
  eliminarParadaFavoritaServicio,
  iniciarSesionServicio,
  obtenerPerfilServicio,
  registrarseServicio,
} from "../services/auth.service";
import { registrarDispositivoPushEnServidor } from "../services/notificaciones.service";

const CLAVE_TOKEN = "sesion.token";
const CLAVE_USUARIO = "sesion.usuario";
const CLAVE_TOKEN_BIOMETRIA = "sesion.token.huella";
const CLAVE_USUARIO_BIOMETRIA = "sesion.usuario.huella";
const CLAVE_LINEAS_FAV_LOCAL = "favoritos.lineas.v2";
const CLAVE_PARADAS_FAV_LOCAL = "favoritos.paradas.v2";
const CLAVE_BIOMETRIA = "seguridad.biometria";

export interface AuthContextValue {
  usuario: Usuario | null;
  restaurando: boolean;
  lineasFavoritas: string[];
  paradasFavoritas: string[];
  biometriaHabilitada: boolean;
  biometriaDisponible: boolean;
  tieneSesionBiometricaGuardada: boolean;
  iniciarSesion: (email: string, contrasenia: string) => Promise<void>;
  iniciarSesionConHuella: () => Promise<boolean>;
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
  const [, setLineasFavLocales] = useState<string[]>([]);
  const [, setParadasFavLocales] = useState<string[]>([]);
  const [biometriaHabilitada, setBiometriaHabilitadaState] =
    useState<boolean>(false);
  const [biometriaDisponible, setBiometriaDisponible] =
    useState<boolean>(false);
  const [tieneSesionBiometricaGuardada, setTieneSesionBiometricaGuardada] =
    useState<boolean>(false);

  useEffect(() => {
    let cancelado = false;

    async function restaurar() {
      try {
        const [tieneHardware, tieneRegistros, tiposSoportados] =
          await Promise.all([
            LocalAuthentication.hasHardwareAsync().catch(() => false),
            LocalAuthentication.isEnrolledAsync().catch(() => false),
            LocalAuthentication.supportedAuthenticationTypesAsync().catch(
              () => [] as LocalAuthentication.AuthenticationType[],
            ),
          ]);
        const soportaHuella = tiposSoportados.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT,
        );
        if (!cancelado) {
          setBiometriaDisponible(
            tieneHardware && tieneRegistros && soportaHuella,
          );
        }

        const [
          favLineasRaw,
          favParadasRaw,
          bioRaw,
          tokenBioGuardado,
          usuarioBioRaw,
        ] = await Promise.all([
          Storage.getItem(CLAVE_LINEAS_FAV_LOCAL).catch(() => null),
          Storage.getItem(CLAVE_PARADAS_FAV_LOCAL).catch(() => null),
          Storage.getItem(CLAVE_BIOMETRIA).catch(() => null),
          SecureStore.getItemAsync(CLAVE_TOKEN_BIOMETRIA).catch(() => null),
          Storage.getItem(CLAVE_USUARIO_BIOMETRIA).catch(() => null),
        ]);

        if (!cancelado) {
          setLineasFavLocales(leerListaGuardada(favLineasRaw, []));
          setParadasFavLocales(leerListaGuardada(favParadasRaw, []));
          setBiometriaHabilitadaState(bioRaw === "true");
          setTieneSesionBiometricaGuardada(
            Boolean(tokenBioGuardado && leerUsuarioGuardado(usuarioBioRaw)),
          );
        }

        const token = await SecureStore.getItemAsync(CLAVE_TOKEN).catch(
          () => null,
        );
        const guardado = leerUsuarioGuardado(
          await Storage.getItem(CLAVE_USUARIO).catch(() => null),
        );

        if (token && guardado) {
          if (!cancelado) setUsuario(guardado);
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
      if (biometriaHabilitada) {
        await SecureStore.setItemAsync(CLAVE_TOKEN_BIOMETRIA, datos.token).catch(
          () => {},
        );
        await Storage.setItem(
          CLAVE_USUARIO_BIOMETRIA,
          JSON.stringify(datos.usuario),
        ).catch(() => {});
        setTieneSesionBiometricaGuardada(true);
      }
      setUsuario(datos.usuario);
      registrarDispositivoPushEnServidor().catch(() => {});
    },
    [biometriaHabilitada],
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
      setBiometriaHabilitadaState(false);
      await Storage.setItem(CLAVE_BIOMETRIA, "false").catch(() => {});
      await SecureStore.deleteItemAsync(CLAVE_TOKEN_BIOMETRIA).catch(() => {});
      await Storage.removeItem(CLAVE_USUARIO_BIOMETRIA).catch(() => {});
      setTieneSesionBiometricaGuardada(false);
      setUsuario(datos.usuario);
      registrarDispositivoPushEnServidor().catch(() => {});
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
    () => (usuario ? usuario.lineasFavoritas : []),
    [usuario],
  );

  const paradasFavoritas = useMemo(
    () => (usuario ? usuario.paradasFavoritas : []),
    [usuario],
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
        await actualizarUsuarioEnCuentasLocales(usuarioActualizado);

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
              await actualizarUsuarioEnCuentasLocales(res.datos);
            }
          }
        } catch {
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
        await actualizarUsuarioEnCuentasLocales(usuarioActualizado);

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
              await actualizarUsuarioEnCuentasLocales(res.datos);
            }
          }
        } catch {
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
      await actualizarUsuarioEnCuentasLocales(actualizado);

      try {
        const res = await actualizarPerfilServicio(cambios);
        if (res.datos) {
          setUsuario(res.datos);
          await Storage.setItem(
            CLAVE_USUARIO,
            JSON.stringify(res.datos),
          ).catch(() => {});
          await actualizarUsuarioEnCuentasLocales(res.datos);
        }
      } catch {
      }
    },
    [usuario],
  );

  const setBiometriaHabilitada = useCallback(
    async (activa: boolean) => {
      if (!usuario) return;
      setBiometriaHabilitadaState(activa);
      await Storage.setItem(CLAVE_BIOMETRIA, activa ? "true" : "false").catch(
        () => {},
      );

      if (activa) {
        const tokenActual = await SecureStore.getItemAsync(CLAVE_TOKEN).catch(
          () => null,
        );
        if (tokenActual) {
          await SecureStore.setItemAsync(CLAVE_TOKEN_BIOMETRIA, tokenActual).catch(
            () => {},
          );
        }
        await Storage.setItem(
          CLAVE_USUARIO_BIOMETRIA,
          JSON.stringify(usuario),
        ).catch(() => {});
        setTieneSesionBiometricaGuardada(true);
      } else {
        await SecureStore.deleteItemAsync(CLAVE_TOKEN_BIOMETRIA).catch(
          () => {},
        );
        await Storage.removeItem(CLAVE_USUARIO_BIOMETRIA).catch(() => {});
        setTieneSesionBiometricaGuardada(false);
      }
    },
    [usuario],
  );

  const autenticarConBiometria = useCallback(async (): Promise<boolean> => {
    try {
      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: "Ingresá con tu huella digital a Transporte Paraná",
        cancelLabel: "Usar contraseña",
        fallbackLabel: "Usar código del teléfono",
      });
      return resultado.success;
    } catch {
      return false;
    }
  }, []);

  const iniciarSesionConHuella = useCallback(async (): Promise<boolean> => {
    if (!biometriaDisponible || !biometriaHabilitada) return false;

    const [tokenBio, usuarioBioRaw] = await Promise.all([
      SecureStore.getItemAsync(CLAVE_TOKEN_BIOMETRIA).catch(() => null),
      Storage.getItem(CLAVE_USUARIO_BIOMETRIA).catch(() => null),
    ]);
    const usuarioGuardado = leerUsuarioGuardado(usuarioBioRaw);
    if (!tokenBio || !usuarioGuardado) return false;

    const ok = await autenticarConBiometria();
    if (!ok) return false;

    await SecureStore.setItem(CLAVE_TOKEN, tokenBio);
    await Storage.setItem(CLAVE_USUARIO, JSON.stringify(usuarioGuardado));
    setUsuario(usuarioGuardado);
    obtenerPerfilServicio()
      .then(async (res) => {
        if (res.datos) {
          setUsuario(res.datos);
          await Storage.setItem(
            CLAVE_USUARIO,
            JSON.stringify(res.datos),
          ).catch(() => {});
          await Storage.setItem(
            CLAVE_USUARIO_BIOMETRIA,
            JSON.stringify(res.datos),
          ).catch(() => {});
        }
      })
      .catch(() => {});
    return true;
  }, [autenticarConBiometria, biometriaDisponible, biometriaHabilitada]);

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      restaurando,
      lineasFavoritas,
      paradasFavoritas,
      biometriaHabilitada,
      biometriaDisponible,
      tieneSesionBiometricaGuardada,
      iniciarSesion,
      iniciarSesionConHuella,
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
      tieneSesionBiometricaGuardada,
      iniciarSesion,
      iniciarSesionConHuella,
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
