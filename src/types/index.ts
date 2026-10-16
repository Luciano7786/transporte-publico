export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface Parada {
  id: string;
  nombre: string;
  coordenadas: Coordenadas;
  lineasIds: string[];
}

export interface Linea {
  id: string;
  numero: string;
  nombre: string;
  color: string;
  empresa: string;
}

export interface Aviso {
  id: string;
  titulo: string;
  detalle: string;
  fecha: string;
}

export type Tema = 'claro' | 'oscuro' | 'sistema';