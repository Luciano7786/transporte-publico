import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import type { Coordenadas } from "../types";

export const COORDENADAS_PARANA_DEFAULT: Coordenadas = {
  latitud: -31.7333,
  longitud: -60.5241,
};

const RADIO_SERVICIO_METROS = 50_000;

export function calcularDistanciaMetros(
  origen: Coordenadas,
  destino: Coordenadas,
): number {
  const RADIO_TIERRA_METROS = 6371e3;
  const radLat1 = (origen.latitud * Math.PI) / 180;
  const radLat2 = (destino.latitud * Math.PI) / 180;
  const deltaLat = ((destino.latitud - origen.latitud) * Math.PI) / 180;
  const deltaLon = ((destino.longitud - origen.longitud) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLat1) *
      Math.cos(radLat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(RADIO_TIERRA_METROS * c);
}

export function formatearDistancia(metros: number): string {
  if (metros < 1000) {
    return `a ${metros} m`;
  }
  const km = (metros / 1000).toFixed(1);
  return `a ${km} km`;
}

export function calcularRumboGrados(
  origen: Coordenadas,
  destino: Coordenadas,
): number {
  const radLat1 = (origen.latitud * Math.PI) / 180;
  const radLat2 = (destino.latitud * Math.PI) / 180;
  const deltaLon = ((destino.longitud - origen.longitud) * Math.PI) / 180;

  const y = Math.sin(deltaLon) * Math.cos(radLat2);
  const x =
    Math.cos(radLat1) * Math.sin(radLat2) -
    Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(deltaLon);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export function obtenerPuntoCardinal(grados: number): string {
  const direcciones = [
    "Norte",
    "Noreste",
    "Este",
    "Sureste",
    "Sur",
    "Suroeste",
    "Oeste",
    "Noroeste",
  ];
  const indice = Math.round(((grados %= 360) < 0 ? grados + 360 : grados) / 45) % 8;
  return direcciones[indice];
}

export interface EstadoUbicacion {
  coordenadas: Coordenadas;
  esReal: boolean;
  cargando: boolean;
  permisoConcedido: boolean;
  error: string | null;
  recargarUbicacion: () => Promise<void>;
}

export function useUbicacion(): EstadoUbicacion {
  const [coordenadas, setCoordenadas] = useState<Coordenadas>(
    COORDENADAS_PARANA_DEFAULT,
  );
  const [esReal, setEsReal] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);
  const [permisoConcedido, setPermisoConcedido] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const consultarUbicacion = async () => {
    try {
      setCargando(true);
      setError(null);

      const serviciosHabilitados = await Location.hasServicesEnabledAsync().catch(
        () => true,
      );

      if (!serviciosHabilitados) {
        if (Platform.OS === "android") {
          await Location.enableNetworkProviderAsync().catch(() => {});
        }
      }

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setPermisoConcedido(false);
        setEsReal(false);
        setCoordenadas(COORDENADAS_PARANA_DEFAULT);
        setError("Permiso de ubicación denegado");
        return;
      }

      setPermisoConcedido(true);

      const ultimaConocida = await Location.getLastKnownPositionAsync().catch(
        () => null,
      );

      if (ultimaConocida) {
        const previa: Coordenadas = {
          latitud: ultimaConocida.coords.latitude,
          longitud: ultimaConocida.coords.longitude,
        };
        if (calcularDistanciaMetros(previa, COORDENADAS_PARANA_DEFAULT) <= RADIO_SERVICIO_METROS) {
          setCoordenadas(previa);
          setEsReal(true);
        }
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const real: Coordenadas = {
        latitud: pos.coords.latitude,
        longitud: pos.coords.longitude,
      };

      if (calcularDistanciaMetros(real, COORDENADAS_PARANA_DEFAULT) > RADIO_SERVICIO_METROS) {
        setCoordenadas(COORDENADAS_PARANA_DEFAULT);
        setEsReal(false);
      } else {
        setCoordenadas(real);
        setEsReal(true);
      }
    } catch (err: any) {
      setError(err?.message || "Servicio de ubicación no disponible");
      setEsReal(false);
      setCoordenadas(COORDENADAS_PARANA_DEFAULT);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    consultarUbicacion();
  }, []);

  return {
    coordenadas,
    esReal,
    cargando,
    permisoConcedido,
    error,
    recargarUbicacion: consultarUbicacion,
  };
}
