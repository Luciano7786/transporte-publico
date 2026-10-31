import type { ArchivoSubido, Aviso, Linea, Parada } from "../types";
import { clienteHttp } from "./cliente";
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

  /**
   * Sube una foto o video a la API (`POST /archivos`).
   * Retorna la URL pública accesible del archivo guardado.
   */
  subirArchivo: async (
    archivo: { uri: string; name?: string; type?: string },
  ): Promise<ArchivoSubido> => {
    const formData = new FormData();
    formData.append("archivo", {
      uri: archivo.uri,
      name: archivo.name || "foto.jpg",
      type: archivo.type || "image/jpeg",
    } as any);

    const res = await clienteHttp<ArchivoSubido>("/archivos", {
      method: "POST",
      body: formData,
    });

    return res.datos;
  },
};