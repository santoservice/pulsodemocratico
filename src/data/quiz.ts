/**
 * Configuración del quiz "¿Dónde te ubicas frente al resto del país?" (PLAN.md §5.3).
 *
 * ⚠️ PROVISIONAL: preguntas, pesos y referencias son un borrador hasta que los
 * investigadores envíen las preguntas reales y su fórmula.
 *
 * Las referencias se escriben como números (no se leen del tablero en tiempo de
 * ejecución) para no meter `tablero.json` en el JS del cliente. `tests/unit/quiz.test.ts`
 * comprueba que coinciden con los datos; si cambian los datos, el test avisa.
 *
 * Wording: siempre "promedio de las personas encuestadas", nunca "nacional"
 * (muestra no probabilística, PLAN.md §5.1).
 */
import { calcularPromedioReferencia, type QuizConfig, type QuizPregunta } from '../lib/quiz';

/** Respaldo cuando una pregunta no tiene indicador comparable en los datos (PROVISIONAL). */
export const REFERENCIA_RESPALDO = 4.9;

export const preguntasQuiz = [
  {
    id: 'ideologia',
    texto: 'En política se habla de izquierda y derecha. ¿Dónde te ubicas?',
    min: 0,
    max: 10,
    etiquetas: ['Izquierda', 'Derecha'],
    invertir: false,
    peso: 1,
    modo: 'distanciaCentro',
    indicador: 'ie',
    // `ie` = distancia media |x − promedio ideológico| en 0–10 (3.ª ronda: 2,8).
    // El quiz usa |x − 5| × 2, así que la referencia es 2 × ie.
    referencia: 5.6,
    referenciaFuente: 'Indicador "ie" (3.ª ronda) × 2',
  },
  {
    id: 'pais-dividido',
    texto: '¿Qué tan dividido ves al país entre los distintos partidos políticos?',
    min: 0,
    max: 10,
    etiquetas: ['Nada dividido', 'Muy dividido'],
    invertir: false,
    peso: 1,
    modo: 'directo',
    indicador: 'wpip',
    // `wpip` = media en escala 0–5 (3.ª ronda: 2,8) → 0–10.
    referencia: 5.6,
    referenciaFuente: 'Indicador "wpip" (3.ª ronda) llevado de 0–5 a 0–10',
  },
  {
    id: 'conversar',
    texto:
      '¿Qué tan dispuesto estarías a conversar de política con alguien que vota distinto a ti?',
    min: 0,
    max: 10,
    etiquetas: ['Nada dispuesto', 'Muy dispuesto'],
    invertir: true,
    peso: 1,
    modo: 'directo',
    // Sin indicador equivalente en los datos → usa REFERENCIA_RESPALDO.
  },
  {
    id: 'gente-comun',
    texto:
      '¿Qué tan de acuerdo estás con la frase "la opinión de la gente común vale más que la de los expertos"?',
    min: 0,
    max: 10,
    etiquetas: ['Nada de acuerdo', 'Totalmente de acuerdo'],
    invertir: false,
    peso: 1,
    modo: 'directo',
    // `pop_expertos` es un % de acuerdo, no una media: no se puede convertir a 0–10 sin
    // supuestos → usa REFERENCIA_RESPALDO.
    indicador: 'pop_expertos',
  },
] as const satisfies readonly QuizPregunta[];

export const quiz: QuizConfig = {
  titulo: '¿Dónde te ubicas frente al resto del país?',
  preguntas: preguntasQuiz,
  referenciaRespaldo: REFERENCIA_RESPALDO,
  // (5,6 + 5,6 + 4,9 + 4,9) / 4 = 5,25 — PROVISIONAL
  promedioReferencia: calcularPromedioReferencia(preguntasQuiz, REFERENCIA_RESPALDO),
  etiquetasEspectro: ['Menos polarizado', 'Más polarizado'],
  provisional: true,
};
