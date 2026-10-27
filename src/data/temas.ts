/**
 * Las 6 secciones de resultados del sitio, en el orden de la maqueta.
 *
 * Regla del cliente: títulos solo con mayúscula inicial (tipo oración), escrita en el
 * contenido (no con CSS `capitalize`).
 */
import { ruta } from '../lib/rutas';

export interface Tema {
  slug: string;
  titulo: string;
  pregunta: string;
  /** Párrafo de introducción de la página del tema (texto del cliente). */
  intro: string;
  descripcion: string;
  /** Nota bajo «Hallazgos sobre…» de la página del tema (p. ej. a quién se compara). */
  nota?: string;
  /** Nombre de icono de Iconify (colección lucide). */
  icono: string;
}

export const temas = [
  {
    slug: 'polarizacion',
    titulo: 'Polarización',
    pregunta: '¿Qué tan divididos estamos como sociedad?',
    intro:
      '¿Cómo perciben los ciudadanos la polarización en el contexto electoral? Explora los resultados relacionados con las percepciones, actitudes y experiencias frente a la polarización.',
    descripcion:
      'Resultados de la encuesta CNEP Colombia 2026 sobre polarización política: qué tan dividido ven el país las personas encuestadas y cómo cambió durante la campaña.',
    icono: 'lucide:split',
  },
  {
    slug: 'populismo',
    titulo: 'Populismo',
    pregunta: '¿Qué tanto apoyo tienen las ideas y discursos populistas?',
    intro:
      '¿Qué actitudes populistas están presentes entre los ciudadanos? Conoce los resultados relacionados con las percepciones sobre el pueblo, las élites y la representación política.',
    descripcion:
      'Resultados de la encuesta CNEP Colombia 2026 sobre el apoyo de las personas encuestadas a ideas y discursos populistas.',
    icono: 'lucide:megaphone',
  },
  {
    slug: 'desinformacion',
    titulo: 'Desinformación',
    pregunta: '¿Qué tan creíbles nos parecen las noticias falsas sobre las elecciones?',
    intro:
      '¿Cómo se relacionan los ciudadanos con la desinformación durante el proceso electoral? Explora sus percepciones, experiencias y comportamientos frente a la información y la desinformación.',
    descripcion:
      'Resultados de la encuesta CNEP Colombia 2026 sobre desinformación: qué tan creíbles parecen las noticias falsas sobre las elecciones.',
    icono: 'lucide:shield-alert',
  },
  {
    slug: 'inteligencia-artificial',
    titulo: 'Inteligencia artificial',
    pregunta: '¿Oportunidad o amenaza para la democracia?',
    intro:
      '¿Qué piensan los ciudadanos sobre el uso de la inteligencia artificial en el contexto electoral? Conoce sus percepciones, experiencias y opiniones sobre esta tecnología.',
    descripcion:
      'Resultados de la encuesta CNEP Colombia 2026 sobre inteligencia artificial: si se ve como oportunidad o amenaza para la democracia.',
    icono: 'lucide:cpu',
  },
  {
    slug: 'consumo-mediatico',
    titulo: 'Consumo mediático',
    pregunta: '¿Dónde nos informamos sobre política y en qué medios confiamos?',
    intro:
      '¿Cómo se informan los ciudadanos durante el proceso electoral? Explora sus hábitos de consumo de medios, plataformas y fuentes de información política.',
    descripcion:
      'Resultados de la encuesta CNEP Colombia 2026 sobre consumo mediático: dónde se informan las personas sobre política y en qué medios confían.',
    icono: 'lucide:newspaper',
  },
  {
    slug: 'comportamiento-juvenil',
    titulo: 'Comportamiento juvenil',
    pregunta: '¿En qué se diferencian los jóvenes del resto?',
    intro:
      '¿Cómo viven y perciben los jóvenes el contexto electoral? Conoce en qué se parecen y en qué se diferencian de los demás participantes en sus actitudes, percepciones y formas de participación política.',
    descripcion:
      'Resultados de la encuesta CNEP Colombia 2026 sobre cómo ven los jóvenes la política y la democracia, comparados con el resto de las personas encuestadas.',
    nota: 'No es una encuesta solo a jóvenes: cada gráfica compara a los participantes de 18 a 30 años con los de 31 años o más (o, en algunas, con las demás franjas de edad), en las mismas preguntas.',
    icono: 'lucide:graduation-cap',
  },
] as const satisfies readonly Tema[];

export type TemaSlug = (typeof temas)[number]['slug'];

/** Enlace a un tema: /resultados con el tema abierto (pestaña por hash). */
export function temaHref(slug: string): string {
  return ruta(`/resultados#${slug}`);
}
