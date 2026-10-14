import { describe, expect, it } from 'vitest';
import { REFERENCIA_RESPALDO, preguntasQuiz, quiz } from '../../src/data/quiz';
import {
  calcularPromedioReferencia,
  calcularResultado,
  normalizarIndicador,
  normalizarRespuesta,
  type QuizConfig,
  type QuizPregunta,
} from '../../src/lib/quiz';
import { getIndicador, getUltimoValor } from '../../src/lib/tablero';

const P = (over: Partial<QuizPregunta> = {}): QuizPregunta => ({
  id: 'p',
  texto: 't',
  min: 0,
  max: 10,
  etiquetas: ['a', 'b'],
  invertir: false,
  peso: 1,
  modo: 'directo',
  ...over,
});

const cfg = (preguntas: QuizPregunta[], promedio = 5): QuizConfig => ({
  titulo: 'x',
  preguntas,
  referenciaRespaldo: 5,
  promedioReferencia: promedio,
  etiquetasEspectro: ['-', '+'],
  provisional: true,
});

describe('normalizarRespuesta', () => {
  it('directo, invertido y fuera de rango', () => {
    expect(normalizarRespuesta(P(), 7)).toBe(7);
    expect(normalizarRespuesta(P({ invertir: true }), 7)).toBe(3);
    expect(normalizarRespuesta(P({ min: 1, max: 5 }), 3)).toBe(5);
    expect(normalizarRespuesta(P(), 15)).toBe(10);
    expect(normalizarRespuesta(P(), -2)).toBe(0);
  });

  it('distancia al centro', () => {
    const d = P({ modo: 'distanciaCentro' });
    expect(normalizarRespuesta(d, 5)).toBe(0);
    expect(normalizarRespuesta(d, 0)).toBe(10);
    expect(normalizarRespuesta(d, 10)).toBe(10);
    expect(normalizarRespuesta(d, 3)).toBe(4);
    expect(normalizarRespuesta(P({ modo: 'distanciaCentro', invertir: true }), 5)).toBe(10);
  });
});

describe('calcularResultado', () => {
  const preguntas = [
    P({ id: 'a' }),
    P({ id: 'b', invertir: true }),
    P({ id: 'c', modo: 'distanciaCentro', peso: 2 }),
  ];

  it('todo en el mínimo', () => {
    const r = calcularResultado({ a: 0, b: 0, c: 0 }, cfg(preguntas));
    // a=0, b=10, c=10 (peso 2) → (0 + 10 + 20) / 4
    expect(r.puntaje).toBeCloseTo(7.5);
    expect(r.posicion).toBe('por encima');
    expect(r.texto).toBe('Estás 2,5 puntos por encima del promedio de las personas encuestadas.');
  });

  it('todo en el máximo', () => {
    const r = calcularResultado({ a: 10, b: 10, c: 10 }, cfg(preguntas));
    // a=10, b=0, c=10 (peso 2) → 30 / 4
    expect(r.puntaje).toBeCloseTo(7.5);
  });

  it('por debajo, igual y singular', () => {
    expect(calcularResultado({ a: 0, b: 10, c: 5 }, cfg(preguntas)).posicion).toBe('por debajo');
    const igual = calcularResultado({ a: 5 }, cfg([P({ id: 'a' })]));
    expect(igual.posicion).toBe('igual');
    expect(igual.texto).toBe('Estás en el promedio de las personas encuestadas.');
    expect(calcularResultado({ a: 6 }, cfg([P({ id: 'a' })])).texto).toContain('1,0 punto por');
  });

  it('omite preguntas sin respuesta y falla si no hay ninguna', () => {
    expect(calcularResultado({ a: 8, b: null }, cfg(preguntas)).puntaje).toBe(8);
    expect(() => calcularResultado({}, cfg(preguntas))).toThrow();
  });

  it('nunca dice "nacional"', () => {
    const r = calcularResultado({ ideologia: 0, 'pais-dividido': 9 }, quiz);
    expect(r.texto).toMatch(/promedio de las personas encuestadas/);
    expect(r.texto).not.toMatch(/nacional/i);
  });
});

describe('config del quiz', () => {
  it('≥ 4 preguntas en escala 0–10 con ids únicos', () => {
    expect(preguntasQuiz.length).toBeGreaterThanOrEqual(4);
    expect(new Set(preguntasQuiz.map((p) => p.id)).size).toBe(preguntasQuiz.length);
    for (const p of preguntasQuiz) expect([p.min, p.max]).toEqual([0, 10]);
    expect(quiz.provisional).toBe(true);
  });

  it('los indicadores enlazados existen', () => {
    for (const p of preguntasQuiz as readonly QuizPregunta[]) {
      if (p.indicador) expect(getIndicador(p.indicador)).toBeDefined();
    }
  });

  it('las referencias coinciden con los datos', () => {
    const ie = getIndicador('ie')!;
    const wpip = getIndicador('wpip')!;
    const refs = Object.fromEntries(
      (preguntasQuiz as readonly QuizPregunta[]).map((p) => [p.id, p.referencia]),
    );
    expect(refs.ideologia).toBeCloseTo(2 * normalizarIndicador(ie, getUltimoValor(ie).valor), 1);
    expect(refs['pais-dividido']).toBeCloseTo(
      normalizarIndicador(wpip, getUltimoValor(wpip).valor),
      1,
    );
    expect(quiz.promedioReferencia).toBeCloseTo(
      calcularPromedioReferencia(preguntasQuiz, REFERENCIA_RESPALDO),
    );
    expect(quiz.promedioReferencia).toBeCloseTo(5.25);
  });
});
