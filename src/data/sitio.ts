import type { ImageMetadata } from 'astro';
import { temas, temaHref } from './temas';
import { titulo } from '../lib/format';
import { ruta } from '../lib/rutas';
import logoCnep from '../assets/logos/cnep.webp';
import logoWisconsin from '../assets/logos/wisconsin.webp';
import logoLaSabana from '../assets/logos/la-sabana.webp';
import logoExternado from '../assets/logos/externado.webp';
import logoComplutense from '../assets/logos/complutense.webp';

export const sitio = {
  nombre: 'Pulso Democrático',
  descripcion:
    'Lo que piensa la ciudadanía colombiana: resultados de la encuesta del Comparative National Elections Project (CNEP), aplicada durante las elecciones presidenciales de 2026.',
  locale: 'es_CO',
  lang: 'es-CO',
  /** TODO: reemplazar por la imagen social real (Fase 5 genera una por tema). */
  ogImage: ruta('/og/default.png'),
} as const;

export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

/** Menú principal. Regla del cliente: títulos con mayúscula inicial (`titulo()`). */
export const nav: NavItem[] = [
  { label: 'Inicio', href: ruta('/') },
  {
    label: 'Resultados',
    href: ruta('/resultados'),
    children: temas.map((t) => ({ label: titulo(t.titulo), href: temaHref(t.slug) })),
  },
  { label: titulo('¿Cómo se hizo la encuesta?'), href: ruta('/como-se-hizo') },
  { label: titulo('Sobre el proyecto'), href: ruta('/sobre-el-proyecto') },
];

export interface Institucion {
  nombre: string;
  sigla?: string;
  url?: string;
  /**
   * Logo oficial (src/assets/logos, versión horizontal sin fondo) para `astro:assets`.
   * `null` = pendiente: se muestra un Placeholder.
   */
  logo: ImageMetadata | null;
}

/**
 * Instituciones participantes ("Una iniciativa de…", footer y pie de las gráficas en
 * detalle), en el orden pedido por el cliente.
 */
export const instituciones: Institucion[] = [
  {
    nombre: 'Comparative National Elections Project',
    sigla: 'CNEP',
    url: 'https://www.upf.edu/web/cnep',
    logo: logoCnep,
  },
  { nombre: 'Universidad de Wisconsin', url: 'https://www.wisc.edu/', logo: logoWisconsin },
  { nombre: 'Universidad de La Sabana', url: 'https://www.unisabana.edu.co/', logo: logoLaSabana },
  {
    nombre: 'Universidad Externado de Colombia',
    url: 'https://www.uexternado.edu.co/',
    logo: logoExternado,
  },
  {
    nombre: 'Universidad Complutense de Madrid',
    url: 'https://www.ucm.es/',
    logo: logoComplutense,
  },
];

export const cnep = {
  nombre: 'Comparative National Elections Project (CNEP)',
  /** Archivo de datos de CNEP (enlace entregado por el cliente). */
  url: 'https://www.upf.edu/web/cnep/data-archive?filtre_1=232c76ce90f8ac7ebc0648c8fb1cde64&myInput_cerca=',
} as const;

/** Créditos del footer (texto exacto del cliente). */
export const creditos =
  '© 2026 Pulso Democrático. Todos los derechos reservados. Datos: Encuesta Colombia 2026, Comparative National Elections Project (CNEP).';

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
 * Preguntas del cuestionario según el cliente ("+100 preguntas"). No sale de tablero.json:
 * allí solo están los indicadores publicados (`getStats().preguntas`).
 */
export const PREGUNTAS_CUESTIONARIO = 100;

/**
 * Cifras clave de la encuesta (fila de estadísticas en Inicio y Resultados), a partir de
 * `getStats()`. `formatear` = formato es-CO de enteros (`format.entero`).
 */
export function cifrasEncuesta(s: CifrasStats, formatear: (n: number) => string): Cifra[] {
  return [
    { value: formatear(s.rondas), label: 'rondas de encuesta', icon: 'lucide:repeat' },
    { value: formatear(s.personas), label: 'personas en la primera ronda', icon: 'lucide:users' },
    {
      value: `+${formatear(PREGUNTAS_CUESTIONARIO)}`,
      label: 'preguntas',
      icon: 'lucide:list-checks',
    },
    { value: formatear(s.regiones), label: 'regiones del país', icon: 'lucide:map' },
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
  const inicio = clean(ruta('/'));
  if (target === inicio) return path === inicio;
  return path === target || path.startsWith(`${target}/`);
}
