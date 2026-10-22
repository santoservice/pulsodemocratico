/**
 * Rutas internas con el `base` de Astro. En GitHub Pages el sitio vive en un subdirectorio
 * (/pulsodemocratico); en desarrollo y con dominio propio el base es '/'.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Antepone el base a una ruta absoluta del sitio ('/resultados'). Idempotente. */
export function ruta(path: string): string {
  if (!BASE || path === BASE || path.startsWith(`${BASE}/`)) return path;
  return `${BASE}${path}`;
}
