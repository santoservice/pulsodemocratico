/**
 * Ficha técnica de la encuesta (página "¿Cómo se hizo la encuesta?", PLAN.md §4.3).
 * `icono` es un nombre de Lucide (sin prefijo; con astro-icon usar `lucide:<icono>`).
 */

export interface ItemFicha {
  id: string;
  titulo: string;
  texto: string | readonly string[];
  icono: string;
  /** Dato aún sin confirmar por el equipo (PLAN.md §9). */
  pendiente?: boolean;
}

export const fichaTecnica = [
  {
    id: 'objetivo',
    titulo: 'Objetivo del estudio',
    texto:
      'Analizar la comunicación y las actitudes políticas de los colombianos durante las elecciones de 2026.',
    icono: 'target',
  },
  {
    id: 'realizado-por',
    titulo: 'Realizado por',
    texto:
      'Universidad de Wisconsin, Universidad Externado de Colombia, Universidad de La Sabana y Universitat Pompeu Fabra.',
    icono: 'building-2',
  },
  {
    id: 'poblacion',
    titulo: 'Población de referencia',
    texto: 'Personas adultas residentes en Colombia.',
    icono: 'users',
  },
  {
    id: 'tipo',
    titulo: 'Tipo de estudio',
    texto: 'Encuesta panel en línea de tres rondas, parte del CNEP.',
    icono: 'clipboard-list',
  },
  {
    id: 'muestra',
    titulo: 'Tamaño de la muestra',
    texto: ['Ronda 1: 2.008 personas', 'Ronda 2: 1.492', 'Ronda 3: 1.175'],
    icono: 'sigma',
  },
  {
    id: 'periodo',
    titulo: 'Periodo de levantamiento',
    texto: ['4 al 19 de mayo', '4 al 16 de junio', '24 de junio al 5 de julio de 2026'],
    icono: 'calendar',
  },
  {
    id: 'cobertura',
    titulo: 'Cobertura geográfica',
    texto: 'Nacional, en cuatro regiones: Atlántica, Central, Pacífica y Amazonía-Orinoquía.',
    icono: 'map',
  },
  {
    id: 'marco',
    titulo: 'Marco muestral',
    texto: 'Panel de 141.000 adultos reclutados previamente por la firma Netquest.',
    icono: 'database',
  },
  {
    id: 'seleccion',
    titulo: 'Método de selección',
    texto: 'Cuotas por género, nivel educativo, estrato socioeconómico y región.',
    icono: 'filter',
  },
  {
    id: 'recoleccion',
    titulo: 'Método de recolección',
    texto: 'Cuestionario en línea, con invitaciones por correo electrónico y aplicación móvil.',
    icono: 'mail',
  },
  {
    id: 'referencia-poblacional',
    titulo: 'Referencia poblacional',
    texto: 'Cifras del DANE (2026) para definir las cuotas.',
    icono: 'bar-chart-3',
  },
  {
    id: 'ponderacion',
    titulo: 'Ponderación',
    texto: 'Por confirmar',
    icono: 'scale',
    pendiente: true,
  },
] as const satisfies readonly ItemFicha[];

export interface Ronda {
  n: 1 | 2 | 3;
  /** Clave de la ronda en `tablero.json` (meta.n_olas). */
  ola: 'w1' | 'w15' | 'w2';
  fechas: string;
  personas: number;
  nota: string;
}

/** Línea de tiempo del panel. `personas` coincide con `meta.n_olas` (verificado en tests). */
export const rondas = [
  {
    n: 1,
    ola: 'w1',
    fechas: '4 al 19 de mayo',
    personas: 2008,
    nota: 'Antes de la primera vuelta (31 de mayo).',
  },
  {
    n: 2,
    ola: 'w15',
    fechas: '4 al 16 de junio',
    personas: 1492,
    nota: 'Entre la primera y la segunda vuelta (21 de junio).',
  },
  {
    n: 3,
    ola: 'w2',
    fechas: '24 de junio al 5 de julio',
    personas: 1175,
    nota: 'Después de la segunda vuelta.',
  },
] as const satisfies readonly Ronda[];
