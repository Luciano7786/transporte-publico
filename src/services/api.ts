import { Parada, Linea, Aviso } from '../types';
import { MOCK_PARADAS, MOCK_LINEAS, MOCK_AVISOS } from './mockData';

export const apiService = {
  getParadas: async (): Promise<Parada[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_PARADAS;
  },

  getParadaById: async (id: string): Promise<Parada | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_PARADAS.find((p) => p.id === id);
  },

  getLineas: async (): Promise<Linea[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_LINEAS;
  },

  getAvisos: async (): Promise<Aviso[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_AVISOS;
  },
};