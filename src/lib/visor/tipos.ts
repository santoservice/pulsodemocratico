/**
 * Tipos de los hallazgos del visor: la tarjeta (HallazgoVisor), su leyenda y la gráfica.
 * Cada gráfica recibe los datos del visor tal cual (visor.json) y calcula lo demás al
 * compilar, como el visor de los investigadores.
 */
import type { TemaSlug } from '../../data/temas';
import type { RondaVisor, TablaVisor, visor } from './comun';

type V = typeof visor;

export interface ItemLeyenda {
  texto: string;
  /**
   * si = dato principal; no = "el resto"; serie = color + forma de la serie i;
   * grupo = círculo del color de la serie i; edad = color + forma de la franja de edad i;
   * color = cuadrado con la clase `bg` (rampas).
   */
  tipo: 'si' | 'no' | 'serie' | 'grupo' | 'edad' | 'color';
  i?: number;
  /** Color de la serie si no es el de `i` (la forma sigue siendo la de `i`). */
  color?: number;
  bg?: string;
}

export interface Leyenda {
  items: ItemLeyenda[];
  nota?: string;
}

export interface RondaColumna extends RondaVisor {
  pct: number;
  /** Texto del recuadro al pasar el mouse. */
  tip: string;
  /** Cambio frente a la ronda anterior ("▲ +12 pts"), salvo la primera. */
  cambio?: string;
}

export interface Serie {
  corto: string;
  valores: number[];
}

export interface FilaEmbudo {
  texto: string;
  pct: number;
  base?: boolean;
  tip?: string;
}

export interface FilaMancuerna {
  titulo: string;
  jovenes: number;
  mayores: number;
  tip: string;
}

/** Una pregunta de 0 a 5 (o con categorías propias) para la gráfica de distribución. */
export interface ItemDistribucion {
  pregunta: string;
  dist: number[];
  pct_alto: number;
  alto: string;
  n: number;
  media?: number;
  polos?: string[];
  cats?: string[];
  tramo?: number[];
  escala?: string;
}

export type GraficaVisor =
  | { tipo: 'columnas'; aria: string; rondas: RondaColumna[] }
  | { tipo: 'pictograma'; aria: string; rondas: RondaColumna[]; entre: string; cambio: string }
  | { tipo: 'embudo'; aria: string; filas: FilaEmbudo[] }
  | {
      tipo: 'lineas';
      aria: string;
      rondas: Required<RondaVisor>[];
      series: Serie[];
      max: number;
      min?: number;
      paso?: number;
      /** Rotula el valor de cada ronda y el cambio entre rondas (pensado para dos series). */
      detalle?: boolean;
      dec?: number;
      unidad?: string;
      signo?: boolean;
      polos?: [string, string];
    }
  | {
      tipo: 'mancuernas';
      aria: string;
      filas: FilaMancuerna[];
      evolucion?: { titulo: string; grupos: { valores: number[]; tip: string }[] };
    }
  | {
      tipo: 'media-rondas';
      aria: string;
      G: V['polarizacion_wapsv'] | V['polarizacion_wapsl'] | V['desinformacion_promedio'];
      polos: [string, string];
      min: number;
      max: number;
      alto: string;
    }
  | { tipo: 'pendiente'; aria: string; C: V['jovenes_populismo'] }
  | { tipo: 'credibilidad'; aria: string; C: V['jovenes_credibilidad'] }
  | { tipo: 'embudo-doble'; aria: string; C: V['jovenes_ia'] }
  | { tipo: 'mini-lineas'; aria: string; C: V['jovenes_medios'] }
  | { tipo: 'apiladas-edad'; aria: string; C: V['jovenes_comparte'] }
  | { tipo: 'columnas-grupos'; aria: string; C: V['desinformacion_ia'] }
  | {
      tipo: 'ranking';
      aria: string;
      filas: { nombre: string; pct: number; sub?: string; tip: string }[];
      /** 100 = escala fija de 0 a 100 %; si no, la barra mayor ocupa todo el ancho. */
      max?: number;
    }
  | { tipo: 'pesas-rondas'; aria: string; C: V['populismo_items'] }
  | { tipo: 'constructos'; aria: string; C: V['populismo_ideologico'] }
  | { tipo: 'lineas-ideologia'; aria: string; C: V['populismo_ideologia'] }
  | { tipo: 'distribucion'; aria: string; it: ItemDistribucion }
  | { tipo: 'chats'; aria: string; C: V['consumo_chats'] }
  | { tipo: 'odio'; aria: string; C: V['consumo_odio'] }
  | {
      tipo: 'titulares';
      aria: string;
      C: V['desinformacion_titulares'] | V['desinformacion_compartir'];
      origen: number;
      medio: string;
      polos: [string, string];
      medida: string;
      alto: string;
      bajo: string;
    }
  | { tipo: 'puntos-ie'; aria: string; G: V['polarizacion_extremos'] }
  | { tipo: 'sankey'; aria: string; G: V['polarizacion_wpip'] };

export interface HallazgoVisor {
  id: string;
  tema: TemaSlug;
  etiqueta: string;
  titulo: string;
  leyenda: Leyenda;
  grafica: GraficaVisor;
  /** "¿Cómo se midió?": puntos de la lista (HTML con <strong>). */
  metodo: string[];
  fuente: string;
  tablas: TablaVisor[];
}
