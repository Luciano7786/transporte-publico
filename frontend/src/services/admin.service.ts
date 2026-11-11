import type { Aviso, Gravedad, RespuestaExitosa } from "../types";
import { clienteHttp } from "./cliente";

export const EMAIL_DIRECCION = "transporte@parana.demo.ar";

export interface ResumenDemoras {
  lineaId: string;
  paradaId: string | null;
  cantidad: number;
  confirmaciones: number;
  ultimo: string;
}

export interface DatosAviso {
  titulo: string;
  detalle: string;
  lineaIds: string[];
  gravedad: Gravedad;
  desde?: string;
  hasta?: string | null;
}

export function esDireccion(email?: string | null): boolean {
  return (email ?? "").trim().toLowerCase() === EMAIL_DIRECCION;
}

export const crearAviso = (
  datos: DatosAviso,
): Promise<RespuestaExitosa<Aviso>> =>
  clienteHttp<Aviso>("/avisos", {
    method: "POST",
    body: JSON.stringify({
      ...datos,
      desde: datos.desde ?? new Date().toISOString(),
    }),
  });

export const editarAviso = (
  id: string,
  cambios: Partial<DatosAviso>,
): Promise<RespuestaExitosa<Aviso>> =>
  clienteHttp<Aviso>(`/avisos/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(cambios),
  });

export const darDeBajaAviso = (id: string): Promise<RespuestaExitosa<Aviso>> =>
  clienteHttp<Aviso>(`/avisos/${encodeURIComponent(id)}/finalizar`, {
    method: "POST",
  });

export const obtenerResumenReportes = (
  agrupar: "linea" | "parada",
): Promise<RespuestaExitosa<ResumenDemoras[]>> =>
  clienteHttp<ResumenDemoras[]>(`/reportes-demora/resumen?agrupar=${agrupar}`);

