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

/**
 * Cifras clave de la encuesta (fila de estadísticas en Inicio y Resultados).
 * TODO Fase 3: derivar de tablero.json (meta.n, rondas, nº de indicadores).
 */
export const cifrasEncuesta: Cifra[] = [
  { value: '3', label: 'rondas de encuesta', icon: 'lucide:repeat' },
  { value: '2.008', label: 'personas en la primera ronda', icon: 'lucide:users' },
  // TODO (cliente): confirmar número total de preguntas (PLAN.md §9).
  { value: '53', label: 'preguntas', icon: 'lucide:list-checks', pending: true },
  { value: '4', label: 'regiones del país', icon: 'lucide:map' },
];

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
