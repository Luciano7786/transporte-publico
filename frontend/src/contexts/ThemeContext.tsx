import { createContext, ReactNode, useCallback, useEffect, useState } from "react";
import Storage from "expo-sqlite/kv-store";
import { Colors, Paleta } from "../constants/theme";
import { useColorScheme } from "../hooks/use-color-scheme";
import { Tema } from "../types";

const CLAVE_TEMA = "preferencias.tema";

export interface ThemeContextValue {
  paleta: Paleta;
  temaActual: "light" | "dark";
  temaPreferido: Tema;
  setTemaUsuario: (tema: Tema) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
  const colorSchemeSystem = useColorScheme();
  const [temaUsuario, setTemaUsuarioState] = useState<Tema>("sistema");

  useEffect(() => {
    let activo = true;
    async function cargarTemaGuardado() {
      try {
        const guardado = await Storage.getItem(CLAVE_TEMA);
        if (
          activo &&
          (guardado === "claro" || guardado === "oscuro" || guardado === "sistema")
        ) {
          setTemaUsuarioState(guardado);
        }
      } catch {
      }
    }
    cargarTemaGuardado();
    return () => {
      activo = false;
    };
  }, []);

  const setTemaUsuario = useCallback((nuevoTema: Tema) => {
    setTemaUsuarioState(nuevoTema);
    Storage.setItem(CLAVE_TEMA, nuevoTema).catch(() => {});
  }, []);

  const temaEfectivo: "light" | "dark" =
    temaUsuario === "sistema"
      ? colorSchemeSystem === "light"
        ? "light"
        : "dark"
      : temaUsuario === "claro"
        ? "light"
        : "dark";

  const paleta = Colors[temaEfectivo];

  return (
    <ThemeContext.Provider
      value={{
        paleta,
        temaActual: temaEfectivo,
        temaPreferido: temaUsuario,
        setTemaUsuario,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
