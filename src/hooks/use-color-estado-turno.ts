
import { Colors } from "../constants/theme";
import { Gravedad } from "../types";
import { useColorScheme } from "./use-color-scheme";

export function useGravedadAvisoColor(gravedad: Gravedad) {
  const theme = (useColorScheme() ?? "dark") as "light" | "dark";
  return Colors[theme].gravedadAviso[gravedad];
}
