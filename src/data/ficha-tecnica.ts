/**
 * Ficha técnica de la encuesta (página "¿Cómo se hizo la encuesta?", PLAN.md §4.3).
 * Textos exactos del documento de especificaciones del cliente (8 cajas, en su orden).
 * `icono` es un nombre de astro-icon: `lucide:<nombre>` o un SVG propio de `src/icons/`.
 */

export interface ItemFicha {
  id: string;
  titulo: string;
  texto: string;
  icono: string;
}

export const fichaTecnica = [
  {
    id: 'objetivo',
    titulo: 'Objetivo del estudio',
    texto:
      'Analizar la comunicación y las actitudes políticas de los colombianos durante las elecciones de 2026.',
    icono: 'diana',
  },
  {
    id: 'realizado-por',
    titulo: 'Realizado por',
    // Texto tal como lo entregó el cliente (incluye Universitat Pompeu Fabra).
    texto:
      'Universidad de La Sabana, Universidad de Wisconsin, Universidad Externado de Colombia y Universitat Pompeu Fabra.',
    icono: 'lucide:university',
  },
  {
    id: 'poblacion',
    titulo: 'Población de referencia',
    texto: 'Personas adultas residentes en Colombia.',
    icono: 'lucide:users-round',
  },
  {
    id: 'cobertura',
    titulo: 'Cobertura geográfica',
    texto: 'Nacional, en cuatro regiones: Atlántica, Central, Pacífica y Amazonía-Orinoquía.',
    icono: 'colombia',
  },
  {
    id: 'tipo',
    titulo: 'Tipo de estudio',
    texto:
      'Encuesta panel en línea de tres rondas, que hace parte del Comparative National Elections Project (CNEP).',
    icono: 'lucide:layers-3',
  },
  {
    id: 'trabajo-de-campo',
    titulo: 'Trabajo de campo',
    texto: 'Firma Netquest, a partir de su panel de 141.000 adultos inscritos previamente.',
    icono: 'lucide:tent',
  },
  {
    id: 'seleccion',
    titulo: 'Selección de participantes',
    texto:
      'Cuotas por género, nivel educativo, estrato socioeconómico y región, según cifras del DANE (2026).',
    icono: 'lucide:chart-pie',
  },
  {
    id: 'recoleccion',
    titulo: 'Método de recolección',
    texto: 'Cuestionario en línea, con invitaciones por correo electrónico y aplicación móvil.',
    icono: 'lucide:monitor-smartphone',
  },
] as const satisfies readonly ItemFicha[];

export interface Ronda {
  n: 1 | 2 | 3;
  /** Clave de la ronda en `tablero.json` (meta.n_olas). */
  ola: 'w1' | 'w15' | 'w2';
  /** Fecha de aplicación (texto del cliente). */
  fechas: string;
  personas: number;
  /** Número de preguntas del cuestionario de la ronda. */
  preguntas: number;
  nota: string;
}

/** Línea de tiempo del panel. `personas` coincide con `meta.n_olas` (verificado en tests). */
export const rondas = [
  {
    n: 1,
    ola: 'w1',
    fechas: '4 al 19 de mayo de 2026',
    personas: 2008,
    preguntas: 190,
    nota: 'Antes de la primera vuelta (31 de mayo).',
  },
  {
    n: 2,
    ola: 'w15',
    fechas: '4 al 16 de junio de 2026',
    personas: 1492,
    preguntas: 160,
    nota: 'Entre la primera y la segunda vuelta (21 de junio).',
  },
  {
    n: 3,
    ola: 'w2',
    fechas: '24 de junio al 5 de julio de 2026',
    personas: 1175,
    preguntas: 170,
    nota: 'Después de la segunda vuelta.',
  },
] as const satisfies readonly Ronda[];

/** Vueltas presidenciales, hitos entre rondas en la línea de tiempo del panel. */
export const vueltas = [
  { nombre: '1.ª vuelta', fecha: '31 de mayo' },
  { nombre: '2.ª vuelta', fecha: '21 de junio' },
] as const;

/** Personas que respondieron las tres rondas (texto del cliente). */
export const PANEL_COMPLETO = 1081;
