/**
 * Utilidades compartidas por las tarjetas del visor de hallazgos (datos en
 * `src/data/visor.json`, extraídos con `pnpm data:visor`). Replican el formato del visor de
 * los investigadores: decimales con coma, signo menos tipográfico, fechas cortas y la
 * forma de describir los cambios entre rondas.
 */
import datos from '../../data/visor.json';
import { decimal, delta, entero } from '../format';

export const visor = datos;
export const meta = datos.meta;

/** Una ronda de la encuesta tal como la describe el visor. */
export interface RondaVisor {
  label: string;
  fechas: string;
  contexto: string;
  inicio?: string;
  fin?: string;
}

/** 3.36 → "3,4" (1 decimal por defecto, como el visor). */
export const fmt = (v: number, d = 1) => decimal(v, d);
/** 2008 → "2.008". */
export const fmtN = (v: number) => entero(v);
/** 11.9 → "+11,9"; −1.6 → "−1,6". */
export const fmtSigno = (v: number, d = 1) => delta(v, d);

/** Valor p como lo escribe el visor: "p < 0,001" o "p = 0,036". */
export const pTexto = (p: number) =>
  p < 0.001 ? 'p < 0,001' : `p = ${decimal(p, p < 0.1 ? 3 : 2)}`;

/** "4 al 19 de mayo" → "4–19 may". */
export const rangoCorto = (fechas: string) =>
  fechas
    .replace(/ de /g, ' ')
    .replace(/mayo/, 'may')
    .replace(/junio/g, 'jun')
    .replace(/julio/, 'jul')
    .replace(' al ', '–');

/** "2026-05-31" → "31 may". */
export const fechaCorta = (iso: string) =>
  `${+iso.slice(8)} ${['may', 'jun', 'jul'][+iso.slice(5, 7) - 5]}`;

/** Cambio en puntos entre rondas: "▲ +12 pts" si es significativo; si no, "= se mantiene". */
export const cambioPts = (dif: number, p: number) =>
  p < 0.05 ? `${dif > 0 ? '▲ +' : '▼ −'}${Math.abs(dif)} pts` : '= se mantiene';

/** Celda de una tabla de datos: texto y, opcionalmente, una línea pequeña debajo (p. ej. el p). */
export type Celda = string | { v: string; sub?: string };

/** Tabla de "Los datos del gráfico" (se pinta en HTML y se descarga como CSV). */
export interface TablaVisor {
  titulo?: string;
  cabecera: string[];
  /** Columnas numéricas (alineadas a la derecha). */
  numericas: number[];
  filas: Celda[][];
  nota?: string;
}

/* ------------------------------------------------------------ estilos SVG */

/**
 * Clases de texto de las gráficas (equivalen a las del CSS del visor). Escritas completas
 * para que Tailwind las detecte.
 */
export const CLS = {
  /** Rótulo principal de un grupo o ronda ("1.ª ronda"). */
  et: 'fill-ink text-[12.5px]',
  /** Texto secundario (fechas, "promedio 2,1"). */
  fecha: 'fill-ink-muted text-[11.5px]',
  /** Marcas de eje. */
  tic: 'fill-ink-muted text-[12px]',
  /** Rótulo de fila (embudos, mancuernas). */
  fila: 'fill-ink-muted text-[12.5px]',
  /** Valores y cambios pequeños en negrilla. */
  dato: 'fill-ink-muted text-[12px] font-extrabold',
  /** Valor al final de una serie. */
  fin: 'text-[12.5px] font-extrabold',
  /** Cambio entre rondas sobre una serie. */
  cambio: 'text-[11px] font-bold italic',
} as const;

/** Halo del color de la tarjeta alrededor de un texto (para que se lea sobre líneas). */
export const HALO = 'paint-order:stroke;stroke:var(--color-surface);stroke-width:5px;stroke-linejoin:round';

/** Zona invisible con recuadro de datos (data-tip) y foco por teclado. */
export const ZONA = 'cursor-pointer outline-none focus-visible:stroke-focus focus-visible:stroke-[3]';

/** Colores de series (1–4), como relleno, texto (currentColor) o trazo. */
export const SERIE_FILL = ['fill-serie-1', 'fill-serie-2', 'fill-serie-3', 'fill-serie-4'];
export const SERIE_TEXT = ['text-serie-1', 'text-serie-2', 'text-serie-3', 'text-serie-4'];
export const SERIE_BG = ['bg-serie-1', 'bg-serie-2', 'bg-serie-3', 'bg-serie-4'];

/** Rampa de un solo tono (6 pasos). */
export const SEQ_FILL = ['fill-seq-1', 'fill-seq-2', 'fill-seq-3', 'fill-seq-4', 'fill-seq-5', 'fill-seq-6'];
/** Texto legible sobre cada paso de la rampa (tokens --color-seq-texto-*, cambian con el tema). */
export const SEQ_TEXTO = [
  'fill-seq-texto-1',
  'fill-seq-texto-2',
  'fill-seq-texto-3',
  'fill-seq-texto-4',
  'fill-seq-texto-5',
  'fill-seq-texto-6',
];
/** Paso de la rampa para la posición k de n categorías (de la menor a la mayor). */
export const pasoSeq = (k: number, n: number) => Math.round((k * 5) / Math.max(n - 1, 1));

export const EDAD_TEXT = ['text-edad-1', 'text-edad-2', 'text-edad-3', 'text-edad-4'];
export const EDAD_FILL = ['fill-edad-1', 'fill-edad-2', 'fill-edad-3', 'fill-edad-4'];
