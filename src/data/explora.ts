/**
 * "Explora los temas principales" (Inicio): por cada tema, un dato destacado y una gráfica
 * con la pregunta más llamativa. Todo sale de tablero.json por la clave del indicador:
 * para cambiar un dato o una gráfica basta con editar este archivo.
 *
 * Tipos de gráfica:
 * - `barras`: un valor por indicador (última ronda), ordenadas de mayor a menor.
 * - `rondas`: un indicador en su escala, con un punto por ronda (cómo cambió).
 * - `evolucion`: línea de un porcentaje ronda a ronda (necesita ≥ 2 rondas).
 * - `proporcion`: pictograma "X de cada 100" de un indicador, con una lista opcional al lado.
 * - `grupos`: columnas de un indicador partido por una variable sociodemográfica (p. ej. edad).
 */
import type { SocioKey } from '../lib/schema';
import type { TemaSlug } from './temas';

export type GraficaExplora =
  | {
      tipo: 'barras';
      titulo: string;
      /** Clave del indicador → etiqueta corta de la barra. */
      barras: Record<string, string>;
    }
  | { tipo: 'rondas'; indicador: string }
  | { tipo: 'evolucion'; titulo: string; indicador: string }
  | {
      tipo: 'proporcion';
      titulo: string;
      indicador: string;
      /** Lista al lado del pictograma: clave del indicador → etiqueta. */
      detalle?: { titulo: string; items: Record<string, string> };
    }
  | { tipo: 'grupos'; titulo: string; indicador: string; socio: SocioKey };

export interface ItemExplora {
  tema: TemaSlug;
  /**
   * Cifra grande del recuadro: valor de la última ronda del indicador o, con `grupo`, el de
   * ese grupo del cruce (p. ej. 18 a 30 años).
   */
  dato: { indicador: string; texto: string; grupo?: { socio: SocioKey; code: number } };
  grafica: GraficaExplora;
}

export const explora: ItemExplora[] = [
  {
    tema: 'polarizacion',
    dato: { indicador: 'outdislike', texto: 'Rechazo a los líderes del bando contrario' },
    grafica: { tipo: 'rondas', indicador: 'outdislike' },
  },
  {
    tema: 'populismo',
    dato: { indicador: 'pop_hablan', texto: 'Cree que los políticos hablan mucho y hacen poco' },
    grafica: {
      tipo: 'barras',
      titulo: 'Están de acuerdo con que…',
      barras: {
        pop_hablan: 'Los políticos hablan mucho y hacen poco',
        pop_traiciona: 'El establecimiento traiciona al pueblo',
        pop_ciudadano: 'Mejor un ciudadano común que un político',
        pop_expertos: 'La gente común sabe más que los expertos',
      },
    },
  },
  {
    tema: 'desinformacion',
    dato: { indicador: 'desinf_frec', texto: 'Ve noticias falsas con frecuencia' },
    // Alternativa: barras de titulares falsos creídos (fk1, fk2, fk4, fk3).
    grafica: {
      tipo: 'evolucion',
      titulo: 'Ve noticias falsas con frecuencia, ronda a ronda',
      indicador: 'desinf_frec',
    },
  },
  {
    tema: 'inteligencia-artificial',
    dato: { indicador: 'ia2', texto: 'Usa IA generativa (ChatGPT, Gemini…)' },
    grafica: {
      tipo: 'proporcion',
      titulo: 'De cada 100 personas, cuántas usan IA generativa',
      indicador: 'ia2',
      detalle: {
        titulo: 'Para qué la usan',
        items: {
          ia9: 'Resumir propuestas de candidatos',
          ia1: 'Informarse sobre política',
          ia3: 'Conocer candidatos y programas',
        },
      },
    },
  },
  {
    tema: 'consumo-mediatico',
    dato: { indicador: 'rs_wa', texto: 'Usa WhatsApp con frecuencia' },
    grafica: {
      tipo: 'barras',
      titulo: 'Redes sociales que usan con frecuencia',
      barras: {
        rs_wa: 'WhatsApp',
        rs_fb: 'Facebook',
        rs_tk: 'TikTok',
        rs_ig: 'Instagram',
        rs_x: 'X (Twitter)',
      },
    },
  },
  {
    tema: 'jovenes',
    dato: {
      indicador: 'rs_tk',
      texto: 'de los jóvenes (18 a 30 años) usa TikTok con frecuencia',
      grupo: { socio: 'edad', code: 1 },
    },
    grafica: {
      tipo: 'grupos',
      titulo: 'Usa TikTok con frecuencia, por edad',
      indicador: 'rs_tk',
      socio: 'edad',
    },
  },
];
