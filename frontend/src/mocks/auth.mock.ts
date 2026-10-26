import { delay } from "../helper/delay";
import type { Usuario } from "../types";

// Solo para pruebas porque el token y contraseña no forman parte de la interfaz base Usuario
interface UsuarioMock extends Usuario {
  contrasenia: string;
  token: string;
}

export const EMAIL_QUE_SIMULA_SIN_RED = "sinred@test.com";

export const USUARIOSMOCK: UsuarioMock[] = [
  {
    id: "usr-320",
    nombre: "Julián Ferrari",
    email: "julian@mail.com",
    lineasFavoritas: ["lin-05"],
    paradasFavoritas: ["par-101"],
    avisosActivos: true,
    tema: "sistema",
    contrasenia: "123456789",
    token: "juliantoken",
  },
  {
    id: "usr-123",
    nombre: "Mariano Jimenez",
    email: "mariano@gmail.com",
    lineasFavoritas: ["lin-02", "lin-05"],
    paradasFavoritas: ["par-101", "par-102"],
    avisosActivos: true,
    tema: "oscuro",
    contrasenia: "123456789",
    token: "marianotoken",
  },
];

export const iniciarSesionMock = async (email: string, contrasenia: string) => {
  try {
    await delay(1000);

    if (email === EMAIL_QUE_SIMULA_SIN_RED) {
      return {
        error: {
          codigo: "SIN_CONEXION",
          mensaje: "No hay conexión. Revisá tu señal e intenta de nuevo",
        },
      };
    }

    const usuarioEncontrado = USUARIOSMOCK.find((u) => u.email === email);

    if (!usuarioEncontrado || usuarioEncontrado.contrasenia !== contrasenia) {
      return {
        error: {
          codigo: "CREDENCIALES_INVALIDAS",
          mensaje: "Email o contraseña incorrectos.",
        },
      };
    }

    const { contrasenia: _contrasenia, token, ...usuario } = usuarioEncontrado;

    return {
      datos: { token, usuario },
      meta: { total: 1, pagina: 1, porPagina: 1 },
    };
  } catch (err) {
    if (err instanceof Error) {
      return {
        error: {
          codigo: "ERROR_INESPERADO",
          mensaje:
            err.message ||
            "Ocurrió un error inesperado al intentar iniciar sesión.",
        },
      };
    }

    return {
      error: {
        codigo: "ERROR_INESPERADO",
        mensaje: "Ocurrió un error inesperado al intentar iniciar sesión.",
      },
    };
  }
};