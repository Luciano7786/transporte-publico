// src/hooks/use-ubicacion.ts
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import type { Coordenadas } from "../types";

/**
 * Coordenadas por defecto en el centro de Paraná (Alameda y Urquiza).
 * Se utilizan como respaldo si el usuario no otorga permisos de GPS o
 * si los servicios de ubicación del emulador/dispositivo están desactivados.
 */
export const COORDENADAS_PARANA_DEFAULT: Coordenadas = {
  latitud: -31.7333,
  longitud: -60.5241,
};

/** Radio máximo (50 km) alrededor de Paraná en el que se considera válida la ubicación del usuario. */
const RADIO_SERVICIO_METROS = 50_000;

/**
 * Calcula la distancia ortodrómica en metros entre dos puntos geográficos (Fórmula de Haversine).
 */
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

/**
 * Formatea una distancia en metros a un texto legible para el usuario.
 * Ejemplos: "a 85 m", "a 450 m", "a 1.2 km"
 */
export function formatearDistancia(metros: number): string {
  if (metros < 1000) {
    return `a ${metros} m`;
  }
  const km = (metros / 1000).toFixed(1);
  return `a ${km} km`;
}

export interface EstadoUbicacion {
  coordenadas: Coordenadas;
  esReal: boolean;
  cargando: boolean;
  permisoConcedido: boolean;
  error: string | null;
  recargarUbicacion: () => Promise<void>;
}

/**
 * Hook para obtener la posición geográfica real del pasajero mediante expo-location.
 */
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

      // 1. Verificar si los servicios de ubicación están encendidos en el dispositivo/emulador
      const serviciosHabilitados = await Location.hasServicesEnabledAsync().catch(
        () => true,
      );

      if (!serviciosHabilitados) {
        if (Platform.OS === "android") {
          // Intenta solicitar encender el GPS en Android si está apagado
          await Location.enableNetworkProviderAsync().catch(() => {});
        }
      }

      // 2. Solicitar permiso en primer plano
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setPermisoConcedido(false);
        setEsReal(false);
        setCoordenadas(COORDENADAS_PARANA_DEFAULT);
        setError("Permiso de ubicación denegado");
        return;
      }

      setPermisoConcedido(true);

      // 3. Intentar obtener primero la última ubicación conocida (rápida/instantánea)
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

      // 4. Obtener ubicación actual con precisión balanceada
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const real: Coordenadas = {
        latitud: pos.coords.latitude,
        longitud: pos.coords.longitude,
      };

      // Fuera del área de servicio (ej: emulador ubicado en California): usar el centro de Paraná
      if (calcularDistanciaMetros(real, COORDENADAS_PARANA_DEFAULT) > RADIO_SERVICIO_METROS) {
        setCoordenadas(COORDENADAS_PARANA_DEFAULT);
        setEsReal(false);
      } else {
        setCoordenadas(real);
        setEsReal(true);
      }
    } catch (err: any) {
      // Si el emulador no tiene señal GPS activa, cae elegantemente en el centro de Paraná
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
