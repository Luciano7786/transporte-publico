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
    id: `hor-${paradaId}-${lineaId}-${tipoDeDia}-${index}`,
    lineaId,
    paradaId,
    sentido,
    tipoDeDia,
    hora,
  }));

const HORARIOS_L5_HABIL = [
  "05:20", "05:42", "06:02", "06:22", "06:42", "07:02", "07:22", "07:42",
  "08:02", "08:22", "08:42", "09:02", "09:22", "09:42",
  "10:02", "10:22", "10:42", "11:02", "11:22", "11:42",
  "12:02", "12:22", "12:42", "13:02", "13:22", "13:42",
  "14:02", "14:22", "14:42", "15:02", "15:22", "15:42",
  "16:02", "16:22", "16:42", "17:02", "17:22", "17:42",
  "18:02", "18:22", "18:42", "19:02", "19:22", "19:42",
  "20:02", "20:22", "20:42", "21:02", "21:22", "21:42",
  "22:02", "22:22", "22:42", "23:02", "23:22",
];

const HORARIOS_L5_SABADO = [
  "06:00", "06:40", "07:20", "08:00", "08:40", "09:20",
  "10:00", "10:40", "11:20", "12:00", "12:40", "13:20",
  "14:00", "14:40", "15:20", "16:00", "16:40", "17:20",
  "18:00", "18:40", "19:20", "20:00", "20:40", "21:20",
  "22:00", "22:40",
];

const HORARIOS_L5_DOMINGO = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00", "22:00",
];

const HORARIOS_L14_HABIL = [
  "05:35", "06:21", "06:51", "07:21", "07:51", "08:21", "08:51",
  "09:21", "09:51", "10:21", "10:51", "11:21", "11:51",
  "12:21", "12:51", "13:21", "13:51", "14:21", "14:51",
  "15:21", "15:51", "16:21", "16:51", "17:21", "17:51",
  "18:21", "18:51", "19:21", "19:51", "20:21", "20:51",
  "21:21", "21:51", "22:21", "22:51", "23:21", "23:51",
];

const HORARIOS_L14_SABADO = [
  "06:30", "07:15", "08:00", "08:45", "09:30", "10:15",
  "11:00", "11:45", "12:30", "13:15", "14:00", "14:45",
  "15:30", "16:15", "17:00", "17:45", "18:30", "19:15",
  "20:00", "20:45", "21:30", "22:15",
];

const HORARIOS_L14_DOMINGO = [
  "07:30", "08:30", "09:30", "10:30", "11:30", "12:30",
  "13:30", "14:30", "15:30", "16:30", "17:30", "18:30",
  "19:30", "20:30", "21:30", "22:30",
];

export const HORARIOS_MOCK: Horario[] = [
  ...generarHorarios("par-101", "lin-05", "ida", "habil", HORARIOS_L5_HABIL),
  ...generarHorarios("par-101", "lin-05", "ida", "sabado", HORARIOS_L5_SABADO),
  ...generarHorarios("par-101", "lin-05", "ida", "domingo", HORARIOS_L5_DOMINGO),
  ...generarHorarios("par-101", "lin-05", "ida", "feriado", HORARIOS_L5_DOMINGO),
  ...generarHorarios("par-101", "lin-14", "ida", "habil", HORARIOS_L14_HABIL),
  ...generarHorarios("par-101", "lin-14", "ida", "sabado", HORARIOS_L14_SABADO),
  ...generarHorarios("par-101", "lin-14", "ida", "domingo", HORARIOS_L14_DOMINGO),
  ...generarHorarios("par-101", "lin-14", "ida", "feriado", HORARIOS_L14_DOMINGO),
  ...generarHorarios("par-102", "lin-01", "ida", "habil", [
    "06:15", "07:15", "08:15", "09:15", "10:15", "10:35", "10:55", "11:15", "11:35",
    "12:15", "13:15", "14:15", "15:15", "16:15", "17:15", "18:15", "19:15", "20:15", "21:15", "22:15",
  ]),
  ...generarHorarios("par-102", "lin-02", "ida", "habil", [
    "06:30", "07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30",
    "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30", "22:30",
  ]),
  ...generarHorarios("par-102", "lin-05", "ida", "habil", [
    "06:45", "07:45", "08:45", "09:45", "10:45", "11:05", "11:25", "11:45",
    "12:45", "13:45", "14:45", "15:45", "16:45", "17:45", "18:45", "19:45", "20:45", "21:45", "22:45",
  ]),
  ...generarHorarios("par-104", "lin-07", "ida", "habil", [
    "06:10", "07:10", "08:10", "09:10", "10:10", "11:10", "12:10", "13:10",
    "14:10", "15:10", "16:10", "17:10", "18:10", "19:10", "20:10", "21:10", "22:10",
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
