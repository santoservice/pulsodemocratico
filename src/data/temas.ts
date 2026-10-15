/**
 * Las 6 secciones de resultados del sitio, en el orden de la maqueta.
 *
 * `dataKey` es la clave del tema en `tablero.json` (ver PLAN.md §5.1).
 * "Jóvenes" no existe en los datos: se construirá con los cruces por edad (PLAN.md §9).
 *
 * Regla del cliente: títulos con mayúscula inicial en cada palabra, escrita en el
 * contenido (no con CSS `capitalize`).
 */
export type TemaDataKey = 'polarizacion' | 'populismo' | 'desinformacion' | 'ia' | 'consumo';

export interface Tema {
  slug: string;
  dataKey: TemaDataKey | null;
  titulo: string;
  pregunta: string;
  descripcion: string;
  /** Nombre de icono de Iconify (colección lucide). */
  icono: string;
}

export const temas = [
  {
    slug: 'polarizacion',
    dataKey: 'polarizacion',
    titulo: 'Polarización',
    pregunta: '¿Qué tan divididos estamos como sociedad?',
    descripcion:
      'Resultados de la encuesta CNEP Colombia 2026 sobre polarización política: qué tan dividido ven el país las personas encuestadas y cómo cambió durante la campaña.',
    icono: 'lucide:split',
  },
  {
    slug: 'populismo',
    dataKey: 'populismo',
    titulo: 'Populismo',
    pregunta: '¿Qué tanto apoyo tienen las ideas y discursos populistas?',
    descripcion:
      'Resultados de la encuesta CNEP Colombia 2026 sobre el apoyo de las personas encuestadas a ideas y discursos populistas.',
    icono: 'lucide:megaphone',
  },
  {
    slug: 'desinformacion',
    dataKey: 'desinformacion',
    titulo: 'Desinformación',
    pregunta: '¿Qué tan creíbles nos parecen las noticias falsas sobre las elecciones?',
    descripcion:
      'Resultados de la encuesta CNEP Colombia 2026 sobre desinformación: qué tan creíbles parecen las noticias falsas sobre las elecciones.',
    icono: 'lucide:shield-alert',
  },
  {
    slug: 'inteligencia-artificial',
    dataKey: 'ia',
    titulo: 'Inteligencia Artificial',
    pregunta: '¿Oportunidad o amenaza para la democracia?',
    descripcion:
      'Resultados de la encuesta CNEP Colombia 2026 sobre inteligencia artificial: si se ve como oportunidad o amenaza para la democracia.',
    icono: 'lucide:cpu',
  },
  {
    slug: 'consumo-mediatico',
    dataKey: 'consumo',
    titulo: 'Consumo Mediático',
    pregunta: '¿Dónde nos informamos sobre política y en qué medios confiamos?',
    descripcion:
      'Resultados de la encuesta CNEP Colombia 2026 sobre consumo mediático: dónde se informan las personas sobre política y en qué medios confían.',
    icono: 'lucide:newspaper',
  },
  {
    slug: 'jovenes',
    dataKey: null,
    titulo: 'Jóvenes',
    pregunta: '¿Cómo ven los jóvenes la política y la democracia?',
    descripcion:
      'Resultados de la encuesta CNEP Colombia 2026 sobre cómo ven los jóvenes la política y la democracia, comparados con el resto de las personas encuestadas.',
    icono: 'lucide:graduation-cap',
  },
] as const satisfies readonly Tema[];

export type TemaSlug = (typeof temas)[number]['slug'];

export function getTemaBySlug(slug: string): Tema | undefined {
  return temas.find((t) => t.slug === slug);
}

/** Sección del sitio que corresponde a un tema de tablero.json. */
export function getTemaByDataKey(key: TemaDataKey): Tema | undefined {
  return temas.find((t) => t.dataKey === key);
}

export function temaHref(slug: string): string {
  return `/resultados/${slug}`;
}
