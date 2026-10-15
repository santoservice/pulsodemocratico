/**
 * Equipo de trabajo (página "Sobre el proyecto"), en el orden pedido por el cliente.
 * Textos del documento de especificaciones, con correcciones menores:
 * - ORCID de Marcela Durán sin el prefijo "Orcid: ".
 * - "Universidad se Friburgo" → "Universidad de Friburgo".
 * - María Paula Arbeláez tiene dos correos.
 *
 * Las fotos viven en src/assets/equipo/<slug>.(png|webp) y se optimizan con astro:assets.
 * Si una persona no tiene foto (`foto` ausente), se muestran sus iniciales.
 */
import type { ImageMetadata } from 'astro';

export interface Integrante {
  slug: string;
  nombre: string;
  institucion: string;
  /** URL completa de ORCID. */
  orcid: string;
  correos: readonly string[];
  perfil: string;
  foto?: ImageMetadata;
}

const fotos = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/equipo/*.{png,jpg,jpeg,webp}',
  {
    eager: true,
  },
);

/** Foto de `src/assets/equipo/<slug>.*`, si existe. */
export function fotoDe(slug: string): ImageMetadata | undefined {
  const entrada = Object.entries(fotos).find(([ruta]) =>
    ruta.replace(/^.*\//, '').startsWith(`${slug}.`),
  );
  return entrada?.[1].default;
}

type DatosIntegrante = Omit<Integrante, 'foto'>;

const datos: readonly DatosIntegrante[] = [
  {
    slug: 'hernando-rojas-hernandez',
    nombre: 'Hernando Rojas Hernández',
    institucion: 'Universidad de Wisconsin / CNEP',
    orcid: 'https://orcid.org/0000-0002-0012-4041',
    correos: ['hrojas@wisc.edu'],
    perfil:
      'Director y Helen Firstbrook Franklin Professor de la Escuela de Periodismo y Comunicación de Masas de la Universidad de Wisconsin, y director del Centro de Investigación en Comunicación Política de la Universidad Externado de Colombia. Doctor en Comunicación de Masas por la Universidad de Wisconsin. Fue editor en jefe del International Journal of Public Opinion Research. Investiga cómo los medios influyen en la toma de decisiones políticas y en la gobernanza democrática.',
  },
  {
    slug: 'oscar-ivan-londono-pardo',
    nombre: 'Óscar Iván Londoño Pardo',
    institucion: 'Universidad de La Sabana',
    orcid: 'https://orcid.org/0000-0002-9307-5559',
    correos: ['oscar.londono@unisabana.edu.co'],
    perfil:
      'Profesor del Departamento de Comunicación Pública de la Universidad de La Sabana. Politólogo de la Universidad Nacional de Colombia, magíster en Comunicación Política de la Universidad Externado y candidato a doctor en Comunicación por la Universidad de La Sabana. Ha sido consultor e investigador en campañas políticas, participación electoral, comunicación de gobierno, consumo mediático, democracia y desinformación.',
  },
  {
    slug: 'ana-maria-cordoba-hernandez',
    nombre: 'Ana María Córdoba Hernández',
    institucion: 'Universidad de La Sabana',
    orcid: 'https://orcid.org/0000-0002-4752-9724',
    correos: ['ana.cordoba@unisabana.edu.co'],
    perfil:
      'Directora de Profesores e Investigación de la Facultad de Comunicación de la Universidad de La Sabana y profesora del Departamento de Comunicación Pública. Doctora en Comunicación Pública por la Universidad de Navarra. Integra el grupo de investigación Observatorio de Medios. Sus líneas de investigación son el contenido mediático internacional, la participación política digital, los movimientos sociales transnacionales y los fenómenos sociopolíticos en redes sociales.',
  },
  {
    slug: 'marcela-duran-camero',
    nombre: 'Marcela Durán Camero',
    institucion: 'Universidad de La Sabana',
    orcid: 'https://orcid.org/0000-0002-5996-9137',
    correos: ['marcela.duran1@unisabana.edu.co'],
    perfil:
      'Jefa del Departamento de Comunicación Pública de la Facultad de Comunicación de la Universidad de La Sabana, donde es docente-investigadora desde 2014. Doctora en Periodismo y magíster en Política Internacional por la Universidad Complutense de Madrid. Integra el grupo de investigación Observatorio de Medios. Sus líneas de investigación son la política internacional, las migraciones, el debate en redes sociales y la esfera pública digital.',
  },
  {
    slug: 'maria-paula-arbelaez-linares',
    nombre: 'María Paula Arbeláez Linares',
    institucion: 'Universidad de La Sabana / Universidad Complutense de Madrid',
    orcid: 'https://orcid.org/0000-0002-1512-604X',
    correos: ['maria.arbelaez4@unisabana.edu.co', 'marbelae@ucm.es'],
    perfil:
      'Profesora e investigadora de la Facultad de Comunicación de la Universidad de La Sabana, en el Departamento de Comunicación Pública. Doctoranda en Sociología y Antropología en la Universidad Complutense de Madrid y magíster en Métodos de Investigación para las Ciencias Sociales por la Universidad Loyola Andalucía. Integra el grupo de investigación Observatorio de Medios y la red internacional Investigar en Red. Investiga populismo, posverdad, polarización y contiendas electorales en audiencias digitales.',
  },
  {
    slug: 'juan-nicolas-garzon-acosta',
    nombre: 'Juan Nicolás Garzón Acosta',
    institucion: 'Universidad de La Sabana',
    orcid: 'https://orcid.org/0009-0004-3279-1764',
    correos: ['juan.garzon@unisabana.edu.co'],
    perfil:
      'Profesor de la Facultad de Estudios Jurídicos Políticos e Internacionales de la Universidad de La Sabana. Internacionalista de la Universidad del Rosario, con especialización en Economía y maestría en Economía Aplicada por la Universidad de los Andes. Recibió el Premio a la Docencia de Excelencia Juan Agustín Uricoechea y Navarro (2016) de la Universidad del Rosario. Investiga relaciones internacionales, economía política internacional, asuntos políticos y económicos de América Latina y economía de lo público.',
  },
  {
    slug: 'miguel-uribe-laverde',
    nombre: 'Miguel Uribe Laverde',
    institucion: 'Universidad de La Sabana',
    orcid: 'https://orcid.org/0000-0002-2460-8657',
    correos: ['miguelurla@unisabana.edu.co'],
    perfil:
      'Director del Doctorado en Inteligencia Artificial y del Laboratorio de Innovación en Inteligencia Artificial Ai-lab de la Facultad de Ingeniería de la Universidad de La Sabana. Doctor en Física por la Universidad de Friburgo, Suiza. Tiene amplia experiencia en simulación y optimización de sistemas complejos. Investiga analítica de datos y desarrollo de modelos de machine learning aplicados a diferentes campos del conocimiento.',
  },
  {
    slug: 'jesus-david-cifuentes-yarce',
    nombre: 'Jesús David Cifuentes Yarce',
    institucion: 'Universidad de La Sabana',
    orcid: 'https://orcid.org/0000-0003-1536-8206',
    correos: ['jesus.cifuentes@unisabana.edu.co'],
    perfil:
      'Profesor de la Facultad de Filosofía y Ciencias Humanas de la Universidad de La Sabana. Doctor en Filosofía por la Universidad de Zaragoza (tesis laureada), magíster y licenciado en Filosofía y Letras por la Universidad Pontificia Bolivariana. Investiga la antropología kantiana, la historia de la antropología filosófica y el humanismo en el siglo XXI. Es autor de libros como Dialogando sobre el diálogo y Crítica de la razón social.',
  },
];

export const equipo: readonly Integrante[] = datos.map((d) => {
  const foto = fotoDe(d.slug);
  return foto ? { ...d, foto } : d;
});

/** Iniciales para el avatar sin foto: "Miguel Uribe Laverde" → "MU". */
export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toLocaleUpperCase('es'))
    .join('');
}

/** Identificador ORCID sin la URL: "0000-0002-0012-4041". */
export function orcidId(url: string): string {
  return url.replace(/^https?:\/\/orcid\.org\//, '');
}

/** Divide un correo en usuario y dominio (para armar el mailto en el navegador). */
export function partesCorreo(correo: string): { usuario: string; dominio: string } {
  const [usuario = '', dominio = ''] = correo.split('@');
  return { usuario, dominio };
}
