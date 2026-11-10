import * as Notifications from "expo-notifications";
import { isRunningInExpoGo } from "expo";
import Storage from "expo-sqlite/kv-store";
import { Platform, LogBox } from "react-native";
import type { Aviso } from "../types";
import { clienteHttp } from "./cliente";

const CLAVE_AVISOS_NOTIFICADOS = "notificaciones.avisos_vistos_ids";

// Silenciamos el aviso informativo de Expo Go SDK 53+ sobre notificaciones push remotas,
// ya que en Expo Go utilizamos las notificaciones locales ("Avisame 10 min antes").
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go",
  "`expo-notifications` functionality is not fully supported in Expo Go",
  "[expo-notifications] Push notifications (remote notifications) are unavailable in Expo Go",
]);

// Configuramos cómo se presentan las notificaciones cuando la app está abierta en primer plano
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // En entorno web o emulador sin soporte nativo de handler, continuamos sin lanzar error
}

/**
 * Solicita permisos de notificaciones locales/push mediante expo-notifications.
 */
export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const actual = await Notifications.getPermissionsAsync();
    if (actual.status === "granted") return true;

    const solicitado = await Notifications.requestPermissionsAsync();
    return solicitado.status === "granted";
  } catch {
    return false;
  }
}

/**
 * Programa una notificación local con expo-notifications para avisar al pasajero
 * 10 minutos antes de que pase el colectivo por la parada.
 * Devuelve el identificador de la notificación programada (o null si se usa fallback).
 */
export async function programarRecordatorioColectivo(params: {
  numeroLinea: string;
  horaColectivo: string;
  nombreParada: string;
  segundosParaDisparo: number;
}): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    const tienePermiso = await solicitarPermisoNotificaciones();
    if (!tienePermiso) return null;

    const idNotificacion = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚌 Línea ${params.numeroLinea} en 10 minutos`,
        body: `El colectivo de las ${params.horaColectivo} está próximo a pasar por ${params.nombreParada} (según tabla).`,
        sound: true,
        data: {
          tipo: "recordatorio_horario",
          numeroLinea: params.numeroLinea,
          hora: params.horaColectivo,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(params.segundosParaDisparo)),
        repeats: false,
      },
    });

    return idNotificacion;
  } catch {
    return null;
  }
}

/**
 * Cancela un recordatorio previamente programado en expo-notifications.
 */
export async function cancelarRecordatorioColectivo(
  notificacionId: string | null | undefined,
): Promise<void> {
  if (!notificacionId || Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificacionId);
  } catch {
    // Si ya se disparó o no existe, ignoramos silenciosamente
  }
}

/**
 * Obtiene el token de Expo Push del dispositivo y lo registra en POST /api/v1/dispositivos
 * cuando el usuario tiene sesión iniciada.
 */
export async function registrarDispositivoPushEnServidor(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  // En Expo Go sobre Android (SDK 53+), getExpoPushTokenAsync no está disponible (solo notificaciones locales),
  // por lo que evitamos invocarlo en ese entorno para no disparar el warning en consola.
  if (Platform.OS === "android" && isRunningInExpoGo()) {
    return null;
  }
  try {
    const tienePermiso = await solicitarPermisoNotificaciones();
    if (!tienePermiso) return null;

    const tokenRes = await Notifications.getExpoPushTokenAsync().catch(() => null);
    const tokenExpo = tokenRes?.data;
    if (!tokenExpo) return null;

    const plataforma = Platform.OS === "ios" ? "ios" : "android";
    await clienteHttp("/dispositivos", {
      method: "POST",
      body: JSON.stringify({ tokenExpo, plataforma }),
    }).catch(() => {});

    return tokenExpo;
  } catch {
    return null;
  }
}

/**
 * Verifica si existen avisos vigentes nuevos que afecten a alguna de las líneas favoritas
 * del pasajero y dispara una notificación local inmediata (solo una vez por aviso).
 */
export async function notificarNuevosAvisosEnLineasFavoritas(
  avisos: Aviso[],
  lineasFavoritas: string[],
  avisosActivos = true,
): Promise<void> {
  if (
    Platform.OS === "web" ||
    !avisosActivos ||
    lineasFavoritas.length === 0 ||
    avisos.length === 0
  ) {
    return;
  }

  try {
    const ahoraIso = new Date().toISOString();
    const avisosFavoritasVigentes = avisos.filter(
      (a) =>
        a.desde <= ahoraIso &&
        (!a.hasta || a.hasta >= ahoraIso) &&
        a.lineaIds.some((id) => lineasFavoritas.includes(id)),
    );

    if (avisosFavoritasVigentes.length === 0) return;

    const guardado = await Storage.getItem(CLAVE_AVISOS_NOTIFICADOS);
    const idsYaNotificados: string[] = guardado ? JSON.parse(guardado) : [];

    const nuevos = avisosFavoritasVigentes.filter(
      (a) => !idsYaNotificados.includes(a.id),
    );
    if (nuevos.length === 0) return;

    const tienePermiso = await solicitarPermisoNotificaciones();
    if (!tienePermiso) return;

    for (const aviso of nuevos) {
      const lineasTexto = aviso.lineaIds
        .map((id) => id.replace("lin-0", "L").replace("lin-", "L"))
        .join(", ");

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ Aviso en tu línea favorita (${lineasTexto})`,
          body: `${aviso.titulo}: ${aviso.detalle}`,
          sound: true,
          data: {
            tipo: "aviso_linea_favorita",
            avisoId: aviso.id,
            lineaIds: aviso.lineaIds,
          },
        },
        trigger: null,
      });

      idsYaNotificados.push(aviso.id);
    }

    await Storage.setItem(
      CLAVE_AVISOS_NOTIFICADOS,
      JSON.stringify(idsYaNotificados),
    );
  } catch {
    // Ignorar errores silenciosamente para no interrumpir la carga
  }
}


