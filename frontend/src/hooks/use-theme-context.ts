import { useContext } from "react";
import { ThemeContext, ThemeContextValue } from "../contexts/ThemeContext";

export function useThemeContext(): ThemeContextValue {
  const contexto = useContext(ThemeContext);
  if (!contexto) {
    throw new Error("useThemeContext debe usarse dentro de <ThemeContextProvider>");
  }
  return contexto;
}
