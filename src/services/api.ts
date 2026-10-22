import type { Aviso, Linea, Parada } from "../types";
import { obtenerAvisos, obtenerLineas } from "./lineas.service";
import { obtenerParadaPorId, obtenerParadas } from "./paradas.service";

export const apiService = {
  getParadas: async (): Promise<Parada[]> => {
    const res = await obtenerParadas();
    return res.datos;
  },

  getParadaById: async (id: string): Promise<Parada | undefined> => {
    try {
      const res = await obtenerParadaPorId(id);
      return res.datos;
    } catch {
      return undefined;
    }
  },

  getLineas: async (): Promise<Linea[]> => {
    const res = await obtenerLineas();
    return res.datos;
  },

  getAvisos: async (): Promise<Aviso[]> => {
    const res = await obtenerAvisos();
    return res.datos;
  },
};