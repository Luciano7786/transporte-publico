import { Platform } from "react-native";

declare const process: {
  env: Record<string, string | undefined>;
};

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android"
    ? "https://showcase-marina-prance.ngrok-free.dev"
    : "http://localhost:3000");

