import { Parada, Linea, Aviso } from '../types';

export const MOCK_LINEAS: Linea[] = [
  {
    id: 'lin-01',
    numero: '1',
    nombre: 'Línea 1 - Centro / San Agustín',
    color: '#E53E3E',
    empresa: 'Ersa Urbana',
  },
  {
    id: 'lin-05',
    numero: '5',
    nombre: 'Línea 5 - Casa de Gobierno / Bajada Grande',
    color: '#3182CE',
    empresa: 'Mariano Moreno',
  },
];

export const MOCK_PARADAS: Parada[] = [
  {
    id: 'par-101',
    nombre: 'Alameda y Urquiza',
    coordenadas: {
      latitud: -31.7331,
      longitud: -60.5297,
    },
    lineasIds: ['lin-01', 'lin-05'],
  },
  {
    id: 'par-102',
    nombre: 'Plaza 1° de Mayo',
    coordenadas: {
      latitud: -31.7318,
      longitud: -60.5285,
    },
    lineasIds: ['lin-01'],
  },
];

export const MOCK_AVISOS: Aviso[] = [
  {
    id: 'avi-01',
    titulo: 'Desvío por obra en Corrientes',
    detalle: 'Las líneas 1 y 5 modificarán su recorrido habitual hasta el viernes.',
    fecha: '2026-10-15',
  },
];