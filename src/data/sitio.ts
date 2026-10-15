import { temas, temaHref } from './temas';

export const sitio = {
  nombre: 'Pulso Democrático',
  descripcion:
    'Lo que piensa la ciudadanía colombiana: resultados de la encuesta nacional CNEP, aplicada durante las elecciones de 2026.',
  locale: 'es_CO',
  lang: 'es-CO',
  /** TODO: reemplazar por la imagen social real (Fase 5 genera una por tema). */
  ogImage: '/og/default.png',
} as const;

export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export const nav: NavItem[] = [
  { label: 'Inicio', href: '/' },
  {
    label: 'Resultados',
    href: '/resultados',
    children: temas.map((t) => ({ label: t.titulo, href: temaHref(t.slug) })),
  },
  { label: '¿Cómo se hizo la encuesta?', href: '/como-se-hizo' },
  { label: 'Sobre el proyecto', href: '/sobre-el-proyecto' },
];

export interface Institucion {
  nombre: string;
  url?: string;
  /** TODO: logos oficiales pendientes (PLAN.md §9). */
  logo?: string;
}

export const instituciones: Institucion[] = [
  { nombre: 'Universidad de Wisconsin' },
  { nombre: 'Universidad Externado de Colombia' },
  { nombre: 'Universidad de La Sabana' },
  { nombre: 'Universitat Pompeu Fabra' },
];

export const cnep = {
  nombre: 'Comparative National Elections Project (CNEP)',
  // TODO: el cliente dio un enlace de LinkedIn; confirmar si hay web oficial (PLAN.md §9).
  url: 'https://es.linkedin.com/company/comparative-national-elections-project',
} as const;

export interface Cifra {
  value: string;
  label: string;
  /** Icono lucide. */
  icon?: string;
  /** Valor pendiente de confirmar por el cliente. */
  pending?: boolean;
}

/** Cifras de `getStats()` (src/lib/tablero.ts); se recibe por parámetro para no acoplar sitio.ts al JSON. */
export interface CifrasStats {
  rondas: number;
  personas: number;
  preguntas: number;
  regiones: number;
}

/**
 * Cifras clave de la encuesta (fila de estadísticas en Inicio y Resultados), a partir de
 * `getStats()`. `formatear` = formato es-CO de enteros (`format.entero`).
 */
export function cifrasEncuesta(s: CifrasStats, formatear: (n: number) => string): Cifra[] {
  return [
    { value: formatear(s.rondas), label: 'rondas de encuesta', icon: 'lucide:repeat' },
    { value: formatear(s.personas), label: 'personas en la primera ronda', icon: 'lucide:users' },
    // TODO (cliente): confirmar número total de preguntas (PLAN.md §9).
    {
      value: formatear(s.preguntas),
      label: 'preguntas',
      icon: 'lucide:list-checks',
      pending: true,
    },
    // TODO: las regiones vienen de la ficha técnica, no de tablero.json.
    { value: formatear(s.regiones), label: 'regiones', icon: 'lucide:map' },
  ];
}

const clean = (p: string) => (p.length > 1 ? p.replace(/\/$/, '') : p);

/** true si `href` es exactamente la página actual (para aria-current="page"). */
export function isCurrent(pathname: string, href: string): boolean {
  return clean(pathname) === clean(href);
}

/** true si la ruta actual está dentro de la sección `href` (para resaltar el menú). */
export function isActive(pathname: string, href: string): boolean {
  const path = clean(pathname);
  const target = clean(href);
  if (target === '/') return path === '/';
  return path === target || path.startsWith(`${target}/`);
}
