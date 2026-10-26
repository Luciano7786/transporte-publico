import { Platform } from "react-native";

declare const process: {
  env: Record<string, string | undefined>;
};

/**
 * URL base de la API de backend (NestJS).
 * Si estás en un teléfono físico con Expo Go en la misma red wifi, definí EXPO_PUBLIC_API_URL en tu .env.
 * Si estás en el emulador de Android: http://10.0.2.2:3000.
 * Si estás en iOS Simulator o Web: http://localhost:3000.
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://localhost:3000");

