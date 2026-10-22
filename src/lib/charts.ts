/**
 * Matemática pura de las gráficas (sin DOM). Los componentes de `src/components/charts/`
 * dibujan con estas funciones en build: el navegador recibe SVG/HTML estático.
 *
 * Convención: las posiciones horizontales se devuelven en **porcentaje (0–100)** para que
 * las gráficas se adapten al ancho de la tarjeta sin escalar el texto (el texto va en HTML,
 * las marcas en SVG con `preserveAspectRatio="none"` y trazos `non-scaling-stroke`).
 */
import { extent, max, sum } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';

/** Restringe `v` a [lo, hi]. */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Posición (0–100 %) de `v` en la escala [lo, hi], recortada a los extremos. */
export function posPct(v: number, lo: number, hi: number): number {
  if (hi <= lo) return 0;
  return clamp(scaleLinear().domain([lo, hi]).range([0, 100])(v), 0, 100);
}

/* ------------------------------------------------------------------- waffle */

export interface WaffleCell {
  x: number;
  y: number;
  lleno: boolean;
}

/**
 * 100 celdas (`cols` × 100/cols) para un valor 0–100. Se llenan por filas desde arriba a la
 * izquierda. El valor se redondea al entero más cercano (igual que `format.pct`).
 */
export function waffleCells(valor: number, cols = 10, size = 10, gap = 2): WaffleCell[] {
  const llenos = clamp(Math.round(valor), 0, 100);
  return Array.from({ length: 100 }, (_, k) => ({
    x: (k % cols) * (size + gap),
    y: Math.floor(k / cols) * (size + gap),
    lleno: k < llenos,
  }));
}

/** Tamaño del viewBox del waffle. */
export function waffleSize(cols = 10, size = 10, gap = 2): { w: number; h: number } {
  const rows = Math.ceil(100 / cols);
  return { w: cols * (size + gap) - gap, h: rows * (size + gap) - gap };
}

/* -------------------------------------------------------------------- ticks */

/** Marcas enteras de la escala (paso 1 hasta 10 unidades; si no, ~5 marcas "bonitas"). */
export function ticksEscala(lo: number, hi: number): number[] {
  if (hi - lo <= 10) {
    const out: number[] = [];
    for (let t = Math.ceil(lo); t <= hi; t++) out.push(t);
    return out;
  }
  return scaleLinear().domain([lo, hi]).ticks(5);
}

/* ---------------------------------------------------------------- barras */

export interface BarDatum {
  key: string;
  label: string;
  valor: number;
}

/** Ordena de mayor a menor (sin mutar). Empates: orden alfabético estable. */
export function ordenarBarras<T extends BarDatum>(datos: readonly T[]): T[] {
  return [...datos].sort((a, b) => b.valor - a.valor || a.label.localeCompare(b.label, 'es'));
}

/* --------------------------------------------------------------- apilada */

export interface Segmento<T> {
  dato: T;
  /** Inicio del segmento (0–100 %). */
  x0: number;
  /** Ancho del segmento (0–100 %). */
  ancho: number;
}

/**
 * Segmentos de una barra apilada al 100 %. Se normaliza por la suma (los porcentajes
 * redondeados pueden sumar 99 o 101).
 */
export function segmentosApilados<T extends { valor: number }>(datos: readonly T[]): Segmento<T>[] {
  const total = sum(datos, (d) => Math.max(0, d.valor));
  if (total <= 0) return [];
  let acc = 0;
  return datos.map((dato) => {
    const ancho = (Math.max(0, dato.valor) / total) * 100;
    const s = { dato, x0: acc, ancho };
    acc += ancho;
    return s;
  });
}

/* ------------------------------------------------------------- dominios */

export interface ConIntervalo {
  valor: number;
  ic?: number;
}

/**
 * Dominio horizontal ajustado a los datos (con sus IC), con margen y recortado a la escala.
 * Así un DotPlot con valores 3,1–3,9 en una escala 0–5 no queda apretado en un punto.
 * `minSpan` evita dominios ridículamente estrechos (por defecto 20 % de la escala).
 */
export function dominioAjustado(
  datos: readonly ConIntervalo[],
  escLo: number,
  escHi: number,
  minSpan = (escHi - escLo) * 0.2,
): [number, number] {
  const [lo0, hi0] = extent(datos.flatMap((d) => [d.valor - (d.ic ?? 0), d.valor + (d.ic ?? 0)]));
  if (lo0 === undefined || hi0 === undefined) return [escLo, escHi];
  let lo = lo0;
  let hi = hi0;
  const pad = Math.max((hi - lo) * 0.15, (escHi - escLo) * 0.03);
  lo -= pad;
  hi += pad;
  if (hi - lo < minSpan) {
    const mid = (lo + hi) / 2;
    lo = mid - minSpan / 2;
    hi = mid + minSpan / 2;
  }
  // Recorte a la escala manteniendo el ancho si es posible.
  if (lo < escLo) {
    hi = Math.min(escHi, hi + (escLo - lo));
    lo = escLo;
  }
  if (hi > escHi) {
    lo = Math.max(escLo, lo - (hi - escHi));
    hi = escHi;
  }
  return [lo, hi];
}

/** Índice del grupo más alejado de la media de los demás (el que "se diferencia"). */
export function indiceExtremo(valores: readonly number[]): number {
  if (valores.length === 0) return -1;
  let best = 0;
  let bestDist = -1;
  valores.forEach((v, k) => {
    const otros = valores.filter((_, j) => j !== k);
    const media = otros.length ? sum(otros) / otros.length : v;
    const d = Math.abs(v - media);
    if (d > bestDist) {
      bestDist = d;
      best = k;
    }
  });
  return best;
}

/* --------------------------------------------------------------- pendiente */

export interface PuntoSlope {
  label: string;
  valor: number;
  ic: number;
}

export interface SlopeLayout {
  /** Puntos en coordenadas del viewBox (x en 0–100, y en 0–alto). */
  puntos: Array<PuntoSlope & { x: number; y: number; y0: number; y1: number }>;
  /** Path de la línea (d3-shape). */
  path: string;
  dominio: [number, number];
}

/**
 * Layout de una pendiente R1→R2→R3: x reparte las rondas entre `margenX` y 100 − `margenX`;
 * y usa un dominio ajustado a los valores ± IC (si `conIc`).
 */
export function slopeLayout(
  serie: readonly PuntoSlope[],
  escLo: number,
  escHi: number,
  alto: number,
  { margenX = 14, margenY = 26, conIc = true } = {},
): SlopeLayout {
  const datos = serie.map((s) => ({ valor: s.valor, ic: conIc ? s.ic : 0 }));
  const dominio = dominioAjustado(datos, escLo, escHi, (escHi - escLo) * 0.15);
  const y = scaleLinear()
    .domain(dominio)
    .range([alto - margenY, margenY]);
  const n = serie.length;
  const x = (k: number) => (n === 1 ? 50 : margenX + (k * (100 - 2 * margenX)) / (n - 1));
  const puntos = serie.map((s, k) => ({
    ...s,
    x: x(k),
    y: y(s.valor),
    y0: y(clamp(s.valor - (conIc ? s.ic : 0), dominio[0], dominio[1])),
    y1: y(clamp(s.valor + (conIc ? s.ic : 0), dominio[0], dominio[1])),
  }));
  const path =
    line<(typeof puntos)[number]>()
      .x((p) => p.x)
      .y((p) => p.y)(puntos) ?? '';
  return { puntos, path, dominio };
}

/** Valor máximo de una lista (0 si está vacía). */
export function maximo(valores: readonly number[]): number {
  return max(valores) ?? 0;
}

/** Redondea a 2 decimales para atributos SVG más cortos. */
export function r2(v: number): number {
  return Math.round(v * 100) / 100;
}
