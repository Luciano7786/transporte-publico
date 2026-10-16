
import { type ColorKeys, Colors } from "../constants/theme";
import { useColorScheme } from './use-color-scheme'


export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorKeys,
): string {
  const theme = (useColorScheme() ?? "dark") as "light" | "dark";
  return props[theme] ?? Colors[theme][colorName];
}
