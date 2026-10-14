/**
 * Builders de JSON-LD (schema.org) y helpers de SEO. Funciones puras.
 * Fase 5 añadirá `datasetJsonLd` (encuesta CNEP) a partir de tablero.json.
 */
import { instituciones, sitio } from '../data/sitio';

export type JsonLd = Record<string, unknown>;

export function pageTitle(title?: string): string {
  if (!title || title === sitio.nombre) return sitio.nombre;
  return `${title} | ${sitio.nombre}`;
}

export function absoluteUrl(path: string, site: URL | string | undefined): string {
  if (!site) return path;
  return new URL(path, site).toString();
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

/** Serializa JSON-LD de forma segura para incrustarlo en <script>. */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
