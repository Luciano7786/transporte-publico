// src/services/errors.service.ts
export class ErrorApi extends Error {
  codigo: string;

  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.name = "ErrorApi";
    this.codigo = codigo;
  }
}