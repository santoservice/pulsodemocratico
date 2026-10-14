/**
 * Cálculo del puntaje del quiz (PLAN.md §5.3). Funciones puras, sin acceso a datos:
 * la configuración vive en `src/data/quiz.ts`.
 *
 * ⚠️ FÓRMULA PROVISIONAL: se reemplaza cuando los investigadores envíen la definitiva.
 *
 * 1. Cada respuesta se lleva a 0–10.
 *    - `directo`: (x − min) / (max − min) × 10.
 *    - `distanciaCentro`: |x₀₋₁₀ − 5| × 2 (0 = centro, 10 = extremo), p. ej. ideología.
 *    - Si `invertir`, v → 10 − v (después de lo anterior).
 * 2. Puntaje = promedio ponderado por `peso` de las preguntas respondidas.
 * 3. Se compara con `promedioReferencia` del config.
 */
import { decimal } from './format';

export type ModoPregunta = 'directo' | 'distanciaCentro';

export interface QuizPregunta {
  id: string;
  texto: string;
  min: number;
  max: number;
  /** Etiquetas de los extremos [min, max]. */
  etiquetas: readonly [string, string];
  /** Si es true, un valor alto en la respuesta significa MENOS en el espectro. */
  invertir: boolean;
  peso: number;
  modo: ModoPregunta;
  /** Indicador del tablero relacionado (para enlazar o derivar la referencia). */
  indicador?: string;
  /**
   * Valor de referencia de las personas encuestadas para esta pregunta, ya en la escala
   * 0–10 del puntaje (después de invertir / distancia al centro). Si falta, se usa
   * `referenciaRespaldo` del config.
   */
  referencia?: number;
  /** De dónde sale `referencia` (texto para el detalle técnico). */
  referenciaFuente?: string;
}

export interface QuizConfig {
  titulo: string;
  preguntas: readonly QuizPregunta[];
  /** Valor 0–10 usado cuando una pregunta no tiene referencia derivada de los datos. */
  referenciaRespaldo: number;
  /** Promedio de referencia 0–10 (ver `calcularPromedioReferencia`). */
  promedioReferencia: number;
  etiquetasEspectro: readonly [string, string];
  /** Marca de que preguntas y fórmula son provisionales. */
  provisional: boolean;
}

export type Respuestas = Readonly<Record<string, number | null | undefined>>;
export type Posicion = 'por encima' | 'por debajo' | 'igual';

export interface ResultadoQuiz {
  /** 0–10 */
  puntaje: number;
  promedio: number;
  /** puntaje − promedio */
  diferencia: number;
  posicion: Posicion;
  texto: string;
  /** Respuesta normalizada 0–10 de cada pregunta respondida. */
  normalizadas: Record<string, number>;
}

/** Diferencias menores que esto (se verían como "0,0") cuentan como "igual". */
export const UMBRAL_IGUAL = 0.05;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Lleva una respuesta a la escala 0–10 del puntaje según el modo y si se invierte. */
export function normalizarRespuesta(p: QuizPregunta, x: number): number {
  if (!(p.max > p.min)) throw new Error(`Pregunta ${p.id}: max debe ser mayor que min.`);
  const v = ((clamp(x, p.min, p.max) - p.min) / (p.max - p.min)) * 10;
  const base = p.modo === 'distanciaCentro' ? Math.abs(v - 5) * 2 : v;
  return p.invertir ? 10 - base : base;
}

/** Lleva un valor de un indicador del tablero (escala esc_lo–esc_hi) a 0–10. */
export function normalizarIndicador(
  ind: { esc_lo: number; esc_hi: number },
  valor: number,
): number {
  return clamp(((valor - ind.esc_lo) / (ind.esc_hi - ind.esc_lo)) * 10, 0, 10);
}

/** Promedio ponderado de las referencias por pregunta (o el respaldo si falta alguna). */
export function calcularPromedioReferencia(
  preguntas: readonly QuizPregunta[],
  respaldo: number,
): number {
  let s = 0;
  let w = 0;
  for (const p of preguntas) {
    s += (p.referencia ?? respaldo) * p.peso;
    w += p.peso;
  }
  return w > 0 ? s / w : respaldo;
}

export function textoResultado(diferencia: number, posicion: Posicion): string {
  if (posicion === 'igual') return 'Estás en el promedio de las personas encuestadas.';
  const d = decimal(Math.abs(diferencia));
  const unidad = d === '1,0' ? 'punto' : 'puntos';
  return `Estás ${d} ${unidad} ${posicion} del promedio de las personas encuestadas.`;
}

/**
 * Calcula el resultado del quiz. Las preguntas sin respuesta se omiten (el peso se
 * reparte entre las respondidas). Lanza error si no hay ninguna respuesta.
 */
export function calcularResultado(respuestas: Respuestas, config: QuizConfig): ResultadoQuiz {
  const normalizadas: Record<string, number> = {};
  let s = 0;
  let w = 0;
  for (const p of config.preguntas) {
    const x = respuestas[p.id];
    if (x == null || !Number.isFinite(x)) continue;
    const v = normalizarRespuesta(p, x);
    normalizadas[p.id] = v;
    s += v * p.peso;
    w += p.peso;
  }
  if (w === 0) throw new Error('No hay respuestas para calcular el resultado.');
  const puntaje = s / w;
  const promedio = config.promedioReferencia;
  const diferencia = puntaje - promedio;
  const posicion: Posicion =
    Math.abs(diferencia) < UMBRAL_IGUAL ? 'igual' : diferencia > 0 ? 'por encima' : 'por debajo';
  return {
    puntaje,
    promedio,
    diferencia,
    posicion,
    texto: textoResultado(diferencia, posicion),
    normalizadas,
  };
}
