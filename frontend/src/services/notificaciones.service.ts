import * as Notifications from "expo-notifications";
import { isRunningInExpoGo } from "expo";
import Storage from "expo-sqlite/kv-store";
import { Platform, LogBox } from "react-native";
import type { Aviso } from "../types";
import { clienteHttp } from "./cliente";

const CLAVE_AVISOS_NOTIFICADOS = "notificaciones.avisos_vistos_ids";
const CANAL_RECORDATORIOS_ID = "recordatorios-colectivo-parana";
const CANAL_AVISOS_ID = "avisos-transporte-parana";

LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go",
  "`expo-notifications` functionality is not fully supported in Expo Go",
  "[expo-notifications] Push notifications (remote notifications) are unavailable in Expo Go",
]);

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });
} catch {
}

export async function asegurarCanalesNotificacionAndroid(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(CANAL_RECORDATORIOS_ID, {
      name: "Recordatorios de llegada de colectivo",
      description: "Alertas 10 minutos antes de que pase tu colectivo por la parada",
      importance: Notifications.AndroidImportance.MAX,
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default",
      enableVibrate: true,
      vibrationPattern: [0, 300, 150, 300],
      enableLights: true,
      lightColor: "#0284C7",
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync(CANAL_AVISOS_ID, {
      name: "Avisos y desvíos de líneas favoritas",
      description: "Alertas de desvíos o interrupciones en tus líneas favoritas",
      importance: Notifications.AndroidImportance.HIGH,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: "default",
      enableVibrate: true,
      vibrationPattern: [0, 250, 150, 250],
      enableLights: true,
      lightColor: "#D97706",
      showBadge: true,
    });
  } catch {
  }
}

export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    await asegurarCanalesNotificacionAndroid();

    const actual = await Notifications.getPermissionsAsync();
    if (actual.status === "granted") return true;

    const solicitado = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return solicitado.status === "granted";
  } catch {
    return false;
  }
}

export async function programarRecordatorioColectivo(params: {
  numeroLinea: string;
  horaColectivo: string;
  nombreParada: string;
  segundosParaDisparo: number;
  fechaDisparo?: Date;
}): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    const tienePermiso = await solicitarPermisoNotificaciones();
    if (!tienePermiso) return null;

    const segundos = Math.max(1, Math.round(params.segundosParaDisparo));
    const fechaObjetivo =
      params.fechaDisparo && params.fechaDisparo.getTime() > Date.now() + 1000
        ? params.fechaDisparo
        : new Date(Date.now() + segundos * 1000);

    const idNotificacion = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚌 Línea ${params.numeroLinea} en 10 minutos`,
        body: `El colectivo de las ${params.horaColectivo} está próximo a pasar por ${params.nombreParada} (según tabla).`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: "#0D254C",
        autoDismiss: true,
        data: {
          tipo: "recordatorio_horario",
          numeroLinea: params.numeroLinea,
          hora: params.horaColectivo,
          nombreParada: params.nombreParada,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(
          1,
          Math.round((fechaObjetivo.getTime() - Date.now()) / 1000),
        ),
        channelId: CANAL_RECORDATORIOS_ID,
      },
    });

    return idNotificacion;
  } catch {
    return null;
  }
}

export async function cancelarRecordatorioColectivo(
  notificacionId: string | null | undefined,
): Promise<void> {
  if (!notificacionId || Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificacionId);
  } catch {
  }
}

export async function registrarDispositivoPushEnServidor(): Promise<string | null> {
  if (Platform.OS === "web") return null;
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

export async function notificarNuevosAvisosEnLineasFavoritas(
  avisos: Aviso[],
  lineasFavoritas: string[],
  avisosActivos = true,
): Promise<void> {
  if (Platform.OS === "web" || !avisosActivos || avisos.length === 0) {
    return;
  }

  try {
    const ahoraIso = new Date().toISOString();
    const avisosVigentes = avisos.filter(
      (a) => a.desde <= ahoraIso && (!a.hasta || a.hasta >= ahoraIso),
    );

    if (avisosVigentes.length === 0) return;

    const guardado = await Storage.getItem(CLAVE_AVISOS_NOTIFICADOS);
    const idsYaNotificados: string[] = guardado ? JSON.parse(guardado) : [];

    const nuevos = avisosVigentes.filter(
      (a) => !idsYaNotificados.includes(a.id),
    );
    if (nuevos.length === 0) return;

    const tienePermiso = await solicitarPermisoNotificaciones();
    if (!tienePermiso) return;

    for (const aviso of nuevos) {
      const lineasTexto = aviso.lineaIds
        .map((id) => id.replace("lin-0", "L").replace("lin-", "L"))
        .join(", ");
      const esDeFavorita =
        lineasFavoritas.length > 0 &&
        aviso.lineaIds.some((id) => lineasFavoritas.includes(id));

      await Notifications.scheduleNotificationAsync({
        content: {
          title: esDeFavorita
            ? `⚠️ Aviso en tu línea favorita (${lineasTexto})`
            : `📢 Nuevo aviso de Transporte (${lineasTexto})`,
          body: `${aviso.titulo}: ${aviso.detalle}`,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          color: "#D97706",
          data: {
            tipo: "aviso_transporte",
            avisoId: aviso.id,
            lineaIds: aviso.lineaIds,
          },
        },
        trigger:
          Platform.OS === "android"
            ? { channelId: CANAL_AVISOS_ID }
            : null,
      });

      idsYaNotificados.push(aviso.id);
    }

    await Storage.setItem(
      CLAVE_AVISOS_NOTIFICADOS,
      JSON.stringify(idsYaNotificados),
    );
  } catch {
  }
}

