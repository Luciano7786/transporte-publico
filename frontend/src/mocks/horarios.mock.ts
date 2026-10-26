import { delay } from "../helper/delay";
import type { Horario, RespuestaApi, Sentido, TipoDeDia } from "../types";
import { mockConfig } from "./lineas.mock";

const generarHorarios = (
  paradaId: string,
  lineaId: string,
  sentido: Sentido,
  tipoDeDia: TipoDeDia,
  horas: string[],
): Horario[] =>
  horas.map((hora, index) => ({
    id: `hor-${paradaId}-${lineaId}-${index}`,
    lineaId,
    paradaId,
    sentido,
    tipoDeDia,
    hora,
  }));

// Horarios para Alameda y Urquiza (par-101) tal como se ven en la maqueta
const HORARIOS_L5_HABIL = [
  "06:02", "06:22", "06:42", "07:02", "07:22", "07:42",
  "08:02", "08:22", "08:42", "09:02", "09:22", "09:42",
  "10:02", "10:22", "10:42", "11:02", "11:22", "11:42",
  "12:02", "12:22", "12:42", "13:02", "13:22", "13:42",
  "14:02", "14:22", "14:42", "15:02", "15:22", "15:42",
  "16:02", "16:22", "16:42", "17:02", "17:22", "17:42",
  "18:02", "18:22", "18:42", "19:02", "19:22", "19:42",
  "20:02", "20:22", "20:42", "21:02", "21:22", "21:42",
  "22:02", "22:22", "22:42", "23:02",
];

const HORARIOS_L14_HABIL = [
  "06:21", "06:51", "07:21", "07:51", "08:21", "08:51",
  "09:21", "09:51", "10:21", "10:51", "11:21", "11:51",
  "12:21", "12:51", "13:21", "13:51", "14:21", "14:51",
  "15:21", "15:51", "16:21", "16:51", "17:21", "17:51",
  "18:21", "18:51", "19:21", "19:51", "20:21", "20:51",
  "21:21", "21:51", "22:21", "22:51", "23:21",
];

export const HORARIOS_MOCK: Horario[] = [
  ...generarHorarios("par-101", "lin-05", "ida", "habil", HORARIOS_L5_HABIL),
  ...generarHorarios("par-101", "lin-14", "ida", "habil", HORARIOS_L14_HABIL),
  ...generarHorarios("par-102", "lin-01", "ida", "habil", [
    "10:15", "10:35", "10:55", "11:15", "11:35",
  ]),
  ...generarHorarios("par-102", "lin-05", "ida", "habil", [
    "10:45", "11:05", "11:25", "11:45",
  ]),
];

export const horariosPorParadaMock = async (
  paradaId: string,
  demora = 300,
): Promise<RespuestaApi<Horario[]>> => {
  await delay(demora);

  if (mockConfig.escenario === "sin-conexion") {
    return {
      error: {
        codigo: "SIN_CONEXION",
        mensaje: "No hay conexión. Revisá tu señal e intentá de nuevo.",
      },
    };
  }

  const horarios = HORARIOS_MOCK.filter((h) => h.paradaId === paradaId);
  return {
    datos: horarios,
    meta: { total: horarios.length, pagina: 1, porPagina: 100 },
  };
};
