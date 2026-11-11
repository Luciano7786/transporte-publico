const PREFIJO = "PARANA:";

export interface CodigoQrParada {
  codigo: string;
  paradaId: string;
}

export function interpretarCodigoQr(texto: string): CodigoQrParada | null {
  const codigo = texto.trim();
  if (!codigo.startsWith(PREFIJO)) return null;

  const paradaId = codigo.slice(PREFIJO.length);
  if (!/^[A-Za-z0-9_-]+$/.test(paradaId)) return null;

  return { codigo, paradaId };
}