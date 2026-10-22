/**
 * Builders de JSON-LD (schema.org) y helpers de SEO. Funciones puras.
 * Fase 5 añadirá `datasetJsonLd` (encuesta CNEP) a partir de tablero.json.
 */
import { instituciones, sitio } from '../data/sitio';
import { ruta } from './rutas';

export type JsonLd = Record<string, unknown>;

export function pageTitle(title?: string): string {
  if (!title || title === sitio.nombre) return sitio.nombre;
  return `${title} | ${sitio.nombre}`;
}

export function absoluteUrl(path: string, site: URL | string | undefined): string {
  if (!site) return ruta(path);
  return new URL(ruta(path), site).toString();
}

export function websiteJsonLd(site: URL | string | undefined): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: sitio.nombre,
    description: sitio.descripcion,
    inLanguage: sitio.lang,
    url: absoluteUrl('/', site),
  };
}

export function organizationJsonLd(site: URL | string | undefined): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: sitio.nombre,
    url: absoluteUrl('/', site),
    member: instituciones.map((i) => ({
      '@type': 'CollegeOrUniversity',
      name: i.nombre,
      ...(i.url ? { url: i.url } : {}),
    })),
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[], site: URL | string | undefined): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path, site),
    })),
  };
}

export interface DatasetInput {
  /** Títulos de los indicadores (variableMeasured). */
  variables: readonly string[];
  /** Ruta de la página que describe el dataset. */
  path: string;
}

/**
 * schema.org `Dataset` de la encuesta CNEP Colombia 2026. Sin afirmaciones de
 * representatividad: la muestra no es probabilística (PLAN.md §5.1).
 */
export function datasetJsonLd(
  { variables, path }: DatasetInput,
  site: URL | string | undefined,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Encuesta panel CNEP Colombia 2026',
    description:
      'Encuesta panel en línea de tres rondas (mayo a julio de 2026) sobre comunicación y actitudes políticas durante las elecciones presidenciales de Colombia: polarización, populismo, desinformación, inteligencia artificial y consumo mediático. Muestra no probabilística por cuotas; los resultados describen a las personas encuestadas.',
    url: absoluteUrl(path, site),
    inLanguage: sitio.lang,
    isAccessibleForFree: true,
    creator: instituciones.map((i) => ({
      '@type': 'Organization',
      name: i.nombre,
      ...(i.url ? { url: i.url } : {}),
    })),
    temporalCoverage: '2026-05-04/2026-07-05',
    spatialCoverage: { '@type': 'Place', name: 'Colombia' },
    variableMeasured: [...variables],
  };
}

/** Serializa JSON-LD de forma segura para incrustarlo en <script>. */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
