import { delay } from "../helper/delay";
import type { Parada, RespuestaApi } from "../types";
import { mockConfig } from "./lineas.mock";

export const PARADAS_MOCK: Parada[] = [
  {
    id: "par-101",
    nombre: "Alameda y Urquiza",
    coordenadas: { latitud: -31.7333, longitud: -60.5241 },
    lineaIds: ["lin-05", "lin-14"],
    sentido: "ida",
    refugio: true,
    codigoQr: "PARANA:par-101",
  },
  {
    id: "par-102",
    nombre: "Plaza Primero de Mayo",
    coordenadas: { latitud: -31.732, longitud: -60.529 },
    lineaIds: ["lin-01", "lin-02", "lin-05"],
    sentido: "ida",
    refugio: true,
    codigoQr: "PARANA:par-102",
  },
  {
    id: "par-103",
    nombre: "Corrientes y 25 de Mayo",
    coordenadas: { latitud: -31.7345, longitud: -60.5255 },
    lineaIds: ["lin-02", "lin-07", "lin-09"],
    sentido: "ida",
    refugio: false,
    codigoQr: "PARANA:par-103",
  },
  {
    id: "par-104",
    nombre: "Santa Fe y Urquiza",
    coordenadas: { latitud: -31.735, longitud: -60.522 },
    lineaIds: ["lin-02", "lin-07", "lin-09"],
    sentido: "ida",
    refugio: true,
    codigoQr: "PARANA:par-104",
  },
  {
    id: "par-105",
    nombre: "Puerto Viejo",
    coordenadas: { latitud: -31.718, longitud: -60.535 },
    lineaIds: ["lin-05"],
    sentido: "ida",
    refugio: true,
    codigoQr: "PARANA:par-105",
  },
  {
    id: "par-106",
    nombre: "San Agustín",
    coordenadas: { latitud: -31.758, longitud: -60.54 },
    lineaIds: ["lin-05", "lin-14"],
    sentido: "vuelta",
    refugio: true,
    codigoQr: "PARANA:par-106",
  },
  {
    id: "par-107",
    nombre: "Bajada Grande",
    coordenadas: { latitud: -31.712, longitud: -60.56 },
    lineaIds: ["lin-07", "lin-14"],
    sentido: "ida",
    refugio: true,
    codigoQr: "PARANA:par-107",
  },
  {
    id: "par-108",
    nombre: "Cinco Esquinas",
    coordenadas: { latitud: -31.741, longitud: -60.518 },
    lineaIds: ["lin-01", "lin-04", "lin-11"],
    sentido: "ida",
    refugio: true,
    codigoQr: "PARANA:par-108",
  },
  {
    id: "par-109",
    nombre: "Almafuerte y Newbery",
    coordenadas: { latitud: -31.748, longitud: -60.495 },
    lineaIds: ["lin-01", "lin-04"],
    sentido: "ida",
    refugio: false,
    codigoQr: "PARANA:par-109",
  },
];

export const paradasMock = async (demora = 400): Promise<RespuestaApi<Parada[]>> => {
  await delay(demora);

  if (mockConfig.escenario === "sin-conexion") {
    return {
      error: {
        codigo: "SIN_CONEXION",
        mensaje: "No hay conexión. Revisá tu señal e intentá de nuevo.",
      },
    };
  }

  const lista = mockConfig.escenario === "vacio" ? [] : PARADAS_MOCK;
  return {
    datos: lista,
    meta: { total: lista.length, pagina: 1, porPagina: 20 },
  };
};

export const paradaPorIdMock = async (
  id: string,
  demora = 200,
): Promise<RespuestaApi<Parada>> => {
  await delay(demora);

  if (mockConfig.escenario === "sin-conexion") {
    return {
      error: {
        codigo: "SIN_CONEXION",
        mensaje: "No hay conexión. Revisá tu señal e intentá de nuevo.",
      },
    };
  }

  const encontrada = PARADAS_MOCK.find((p) => p.id === id);
  if (!encontrada) {
    return {
      error: {
        codigo: "PARADA_NO_ENCONTRADA",
        mensaje: "No existe esa parada.",
      },
    };
  }

  return {
    datos: encontrada,
    meta: { total: 1, pagina: 1, porPagina: 1 },
  };
};
