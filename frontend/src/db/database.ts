// src/db/database.ts
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import { LINEAS_MOCK } from "../mocks/lineas.mock";
import { HORARIOS_MOCK } from "../mocks/horarios.mock";
import { PARADAS_MOCK } from "../mocks/paradas.mock";
import type { Horario, Linea, MotivoDemora, Parada, Sentido } from "../types";

const NOMBRE_BASE_DATOS = "transporte_parana.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;
let inicializacionPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export interface ReporteOfflineLocal {
  id: string;
  lineaId: string;
  paradaId: string;
  motivo: MotivoDemora;
  comentario: string | null;
  fechaHora: string;
  sincronizado: number; // 0 = pendiente, 1 = enviado
}

/**
 * Obtiene la instancia abierta de la base de datos SQLite (patrón Singleton).
 */
export async function obtenerBaseDeDatos(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === "web") {
    // SQLite en entorno web de Expo requiere configuración de headers OPFS adicionales.
    // Devolvemos null de forma segura para no romper la app en navegador.
    return null;
  }

  if (dbInstance) {
    return dbInstance;
  }

  if (!inicializacionPromise) {
    inicializacionPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(NOMBRE_BASE_DATOS);
      await inicializarTablas(db);
      dbInstance = db;
      return db;
    })();
  }

  return inicializacionPromise;
}

/**
 * Crea las tablas locales requeridas por la cátedra (DDL especificado en el informe técnico).
 */
async function inicializarTablas(db: SQLite.SQLiteDatabase): Promise<void> {
  // 1. DDL según Sección 4 del Informe Técnico
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS cache_lineas (
      id TEXT PRIMARY KEY NOT NULL,
      numero TEXT NOT NULL,
      nombre TEXT NOT NULL,
      color TEXT NOT NULL,
      empresa TEXT NOT NULL,
      activa INTEGER NOT NULL,
      json_completo TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cache_paradas (
      id TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL,
      latitud REAL NOT NULL,
      longitud REAL NOT NULL,
      sentido TEXT NOT NULL,
      refugio INTEGER NOT NULL,
      json_completo TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cola_reportes_offline (
      id TEXT PRIMARY KEY NOT NULL,
      lineaId TEXT NOT NULL,
      paradaId TEXT NOT NULL,
      motivo TEXT NOT NULL,
      comentario TEXT,
      fechaHora TEXT NOT NULL,
      sincronizado INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cache_horarios (
      paradaId TEXT NOT NULL,
      lineaId TEXT NOT NULL,
      sentido TEXT NOT NULL,
      json_completo TEXT NOT NULL,
      PRIMARY KEY (paradaId, lineaId, sentido)
    );
  `);

  // 2. Poblado inicial con datos semilla si la base está recién creada
  try {
    const cantParadas = await db.getFirstAsync<{ cantidad: number }>(
      "SELECT COUNT(*) AS cantidad FROM cache_paradas;",
    );
    if (!cantParadas || cantParadas.cantidad === 0) {
      for (const parada of PARADAS_MOCK) {
        await db.runAsync(
          `INSERT OR REPLACE INTO cache_paradas (id, nombre, latitud, longitud, sentido, refugio, json_completo)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            parada.id,
            parada.nombre,
            parada.coordenadas.latitud,
            parada.coordenadas.longitud,
            parada.sentido,
            parada.refugio ? 1 : 0,
            JSON.stringify(parada),
          ],
        );
      }
    }

    const cantLineas = await db.getFirstAsync<{ cantidad: number }>(
      "SELECT COUNT(*) AS cantidad FROM cache_lineas;",
    );
    if (!cantLineas || cantLineas.cantidad === 0) {
      for (const linea of LINEAS_MOCK) {
        await db.runAsync(
          `INSERT OR REPLACE INTO cache_lineas (id, numero, nombre, color, empresa, activa, json_completo)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            linea.id,
            linea.numero,
            linea.nombre,
            linea.color,
            linea.empresa,
            linea.activa ? 1 : 0,
            JSON.stringify(linea),
          ],
        );
      }
    }

    const cantHorarios = await db.getFirstAsync<{ cantidad: number }>(
      "SELECT COUNT(*) AS cantidad FROM cache_horarios;",
    );
    if (!cantHorarios || cantHorarios.cantidad === 0) {
      const paradasIds = Array.from(new Set(HORARIOS_MOCK.map((h) => h.paradaId)));
      for (const pId of paradasIds) {
        const horariosParada = HORARIOS_MOCK.filter((h) => h.paradaId === pId);
        await db.runAsync(
          `INSERT OR REPLACE INTO cache_horarios (paradaId, lineaId, sentido, json_completo)
           VALUES (?, ?, ?, ?);`,
          [pId, "todas", "todos", JSON.stringify(horariosParada)],
        );
      }
    }
  } catch (err) {
    console.warn("No se pudieron insertar los datos semilla iniciales:", err);
  }
}

/**
 * Inicializa de forma explícita la base de datos (por ejemplo, en el arranque de la app).
 */
export async function inicializarBaseDeDatos(): Promise<void> {
  try {
    await obtenerBaseDeDatos();
  } catch (error) {
    console.warn("No se pudo inicializar la base de datos SQLite local:", error);
  }
}

// ============================================================================
// 1. CACHÉ DE LÍNEAS (cache_lineas)
// ============================================================================

/**
 * Guarda o actualiza un lote de líneas en la tabla cache_lineas.
 */
export async function guardarLineasEnCache(lineas: Linea[]): Promise<void> {
  const db = await obtenerBaseDeDatos();
  if (!db || lineas.length === 0) return;

  await db.withTransactionAsync(async () => {
    for (const linea of lineas) {
      await db.runAsync(
        `INSERT OR REPLACE INTO cache_lineas (id, numero, nombre, color, empresa, activa, json_completo)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          linea.id,
          linea.numero,
          linea.nombre,
          linea.color,
          linea.empresa,
          linea.activa ? 1 : 0,
          JSON.stringify(linea),
        ],
      );
    }
  });
}

/**
 * Lee todas las líneas almacenadas en cache_lineas.
 */
export async function obtenerLineasDeCache(): Promise<Linea[]> {
  const db = await obtenerBaseDeDatos();
  if (!db) return [];

  const filas = await db.getAllAsync<{ json_completo: string }>(
    "SELECT json_completo FROM cache_lineas ORDER BY numero ASC;",
  );

  return filas
    .map((fila) => {
      try {
        return JSON.parse(fila.json_completo) as Linea;
      } catch {
        return null;
      }
    })
    .filter((l): l is Linea => l !== null);
}

/**
 * Obtiene el detalle de una línea específica por su ID desde el caché local.
 */
export async function obtenerLineaPorIdDeCache(id: string): Promise<Linea | null> {
  const db = await obtenerBaseDeDatos();
  if (!db) return null;

  const fila = await db.getFirstAsync<{ json_completo: string }>(
    "SELECT json_completo FROM cache_lineas WHERE id = ? LIMIT 1;",
    [id],
  );

  if (!fila) return null;

  try {
    return JSON.parse(fila.json_completo) as Linea;
  } catch {
    return null;
  }
}

// ============================================================================
// 2. CACHÉ DE PARADAS (cache_paradas)
// ============================================================================

/**
 * Guarda o actualiza un lote de paradas en la tabla cache_paradas.
 */
export async function guardarParadasEnCache(paradas: Parada[]): Promise<void> {
  const db = await obtenerBaseDeDatos();
  if (!db || paradas.length === 0) return;

  await db.withTransactionAsync(async () => {
    for (const parada of paradas) {
      await db.runAsync(
        `INSERT OR REPLACE INTO cache_paradas (id, nombre, latitud, longitud, sentido, refugio, json_completo)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          parada.id,
          parada.nombre,
          parada.coordenadas.latitud,
          parada.coordenadas.longitud,
          parada.sentido,
          parada.refugio ? 1 : 0,
          JSON.stringify(parada),
        ],
      );
    }
  });
}

/**
 * Lee todas las paradas almacenadas en cache_paradas.
 */
export async function obtenerParadasDeCache(): Promise<Parada[]> {
  const db = await obtenerBaseDeDatos();
  if (!db) return [];

  const filas = await db.getAllAsync<{ json_completo: string }>(
    "SELECT json_completo FROM cache_paradas ORDER BY nombre ASC;",
  );

  return filas
    .map((fila) => {
      try {
        return JSON.parse(fila.json_completo) as Parada;
      } catch {
        return null;
      }
    })
    .filter((p): p is Parada => p !== null);
}

/**
 * Obtiene una parada por su ID desde el caché local.
 */
export async function obtenerParadaPorIdDeCache(id: string): Promise<Parada | null> {
  const db = await obtenerBaseDeDatos();
  if (!db) return null;

  const fila = await db.getFirstAsync<{ json_completo: string }>(
    "SELECT json_completo FROM cache_paradas WHERE id = ? LIMIT 1;",
    [id],
  );

  if (!fila) return null;

  try {
    return JSON.parse(fila.json_completo) as Parada;
  } catch {
    return null;
  }
}

/**
 * Resuelve una parada a partir de su código QR o ID en caché local.
 */
export async function obtenerParadaPorQrDeCache(codigoQrOId: string): Promise<Parada | null> {
  const paradas = await obtenerParadasDeCache();
  if (paradas.length === 0) return null;

  // Busca por codigoQr exacto o coincidencia de ID
  const encontrada = paradas.find(
    (p) => p.codigoQr === codigoQrOId || p.id === codigoQrOId,
  );

  return encontrada ?? null;
}

// ============================================================================
// 3. CACHÉ DE HORARIOS (cache_horarios)
// ============================================================================

/**
 * Guarda los horarios de una parada para una combinación de línea y sentido.
 */
export async function guardarHorariosEnCache(
  paradaId: string,
  lineaId: string = "todas",
  sentido: string = "todos",
  horarios: Horario[],
): Promise<void> {
  const db = await obtenerBaseDeDatos();
  if (!db) return;

  await db.runAsync(
    `INSERT OR REPLACE INTO cache_horarios (paradaId, lineaId, sentido, json_completo)
     VALUES (?, ?, ?, ?);`,
    [paradaId, lineaId, sentido, JSON.stringify(horarios)],
  );
}

/**
 * Obtiene los horarios cacheados de una parada.
 */
export async function obtenerHorariosDeCache(
  paradaId: string,
  lineaId: string = "todas",
  sentido: string = "todos",
): Promise<Horario[] | null> {
  const db = await obtenerBaseDeDatos();
  if (!db) return null;

  const fila = await db.getFirstAsync<{ json_completo: string }>(
    `SELECT json_completo FROM cache_horarios 
     WHERE paradaId = ? AND lineaId = ? AND sentido = ? LIMIT 1;`,
    [paradaId, lineaId, sentido],
  );

  if (!fila) return null;

  try {
    return JSON.parse(fila.json_completo) as Horario[];
  } catch {
    return null;
  }
}

// ============================================================================
// 4. COLA DE REPORTES OFFLINE (cola_reportes_offline)
// ============================================================================

/**
 * Encola un reporte de demora generado sin internet.
 */
export async function encolarReporteOffline(reporte: {
  id: string;
  lineaId: string;
  paradaId: string;
  motivo: MotivoDemora;
  comentario?: string | null;
  fechaHora: string;
}): Promise<void> {
  const db = await obtenerBaseDeDatos();
  if (!db) return;

  await db.runAsync(
    `INSERT OR REPLACE INTO cola_reportes_offline (id, lineaId, paradaId, motivo, comentario, fechaHora, sincronizado)
     VALUES (?, ?, ?, ?, ?, ?, 0);`,
    [
      reporte.id,
      reporte.lineaId,
      reporte.paradaId,
      reporte.motivo,
      reporte.comentario ?? null,
      reporte.fechaHora,
    ],
  );
}

/**
 * Obtiene los reportes que aún no fueron sincronizados (sincronizado = 0).
 */
export async function obtenerReportesPendientes(): Promise<ReporteOfflineLocal[]> {
  const db = await obtenerBaseDeDatos();
  if (!db) return [];

  return db.getAllAsync<ReporteOfflineLocal>(
    "SELECT * FROM cola_reportes_offline WHERE sincronizado = 0 ORDER BY fechaHora ASC;",
  );
}

/**
 * Marca un reporte como sincronizado exitosamente.
 */
export async function marcarReporteSincronizado(id: string): Promise<void> {
  const db = await obtenerBaseDeDatos();
  if (!db) return;

  await db.runAsync(
    "UPDATE cola_reportes_offline SET sincronizado = 1 WHERE id = ?;",
    [id],
  );
}

/**
 * Elimina los reportes que ya fueron sincronizados.
 */
export async function limpiarReportesSincronizados(): Promise<void> {
  const db = await obtenerBaseDeDatos();
  if (!db) return;

  await db.runAsync("DELETE FROM cola_reportes_offline WHERE sincronizado = 1;");
}

