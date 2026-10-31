import { createContext, ReactNode, useEffect, useState } from "react";
import { Colors, Paleta } from "../constants/theme";
import { useColorScheme } from "../hooks/use-color-scheme";
import { Tema } from "../types";

export interface ThemeContextValue {
  paleta: Paleta;
  temaActual: "light" | "dark";
  setTemaUsuario: (tema: Tema) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
  const colorSchemeSystem = useColorScheme();

  const [temaUsuario, setTemaUsuario] = useState<Tema>("sistema");

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
    <ThemeContext.Provider value={{ paleta, temaActual: temaEfectivo, setTemaUsuario }}>
      {children}
    </ThemeContext.Provider>
  );
};
