// src/utils/qr.ts
//
// Los carteles de las paradas llevan un QR con el texto "PARANA:par-101"
// (el mismo valor que Parada.codigoQr). Cualquier otro QR no es nuestro y la
// app no tiene que romperse: simplemente se lo rechaza.

const PREFIJO = "PARANA:";

export interface CodigoQrParada {
  /** Texto completo del QR, tal cual está en Parada.codigoQr. */
  codigo: string;
  /** Id de la parada que viene dentro del código. */
  paradaId: string;
}

/** Devuelve null si el texto no tiene el formato de un QR de parada. */
export function interpretarCodigoQr(texto: string): CodigoQrParada | null {
  const codigo = texto.trim();
  if (!codigo.startsWith(PREFIJO)) return null;

  const paradaId = codigo.slice(PREFIJO.length);
  if (!/^[A-Za-z0-9_-]+$/.test(paradaId)) return null;

  return { codigo, paradaId };
}