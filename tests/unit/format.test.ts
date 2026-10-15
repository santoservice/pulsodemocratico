import { describe, expect, it } from 'vitest';
import {
  PCT_SEPARADOR,
  SIGNO_MENOS,
  decimal,
  delta,
  deltaSegunStat,
  entero,
  numero,
  pct,
  pctOrMedia,
  titulo,
} from '../../src/lib/format';

const pctInd = { stat: 'pct' } as const;
const mediaInd = { stat: 'media' } as const;

describe('format es-CO', () => {
  it('enteros con punto de miles (también 4 cifras)', () => {
    expect(entero(2008)).toBe('2.008');
    expect(entero(141000)).toBe('141.000');
    expect(entero(53)).toBe('53');
    expect(entero(26.5)).toBe('27');
  });

  it('decimales con coma', () => {
    expect(decimal(4.93)).toBe('4,9');
    expect(decimal(5)).toBe('5,0');
    expect(decimal(1234.56)).toBe('1.234,6');
    expect(decimal(-0.01)).toBe('0,0');
  });

  it('porcentajes sin decimales y con separador configurable', () => {
    expect(pct(26.5)).toBe(`27${PCT_SEPARADOR}%`);
    expect(pct(26.5)).toBe('27 %');
  });

  it('delta con signo y menos tipográfico', () => {
    expect(delta(3.2)).toBe('+3,2');
    expect(delta(-1)).toBe(`${SIGNO_MENOS}1,0`);
    expect(delta(0)).toBe('0,0');
    expect(delta(-0.01)).toBe('0,0');
    expect(delta(-4.4, 0)).toBe(`${SIGNO_MENOS}4`);
  });

  it('según stat del indicador', () => {
    expect(pctOrMedia(pctInd, 32.3)).toBe('32 %');
    expect(pctOrMedia(mediaInd, 2.84)).toBe('2,8');
    expect(numero(pctInd, 32.3)).toBe('32');
    expect(numero(mediaInd, 7)).toBe('7,0');
    expect(deltaSegunStat(pctInd, 3.4)).toBe('+3');
    expect(deltaSegunStat(mediaInd, -0.36)).toBe(`${SIGNO_MENOS}0,4`);
  });
});

describe('titulo (regla del cliente: mayúscula inicial salvo palabras menores)', () => {
  it.each([
    ['Resultados de la encuesta', 'Resultados de la Encuesta'],
    ['¿Cómo se hizo la encuesta?', '¿Cómo se Hizo la Encuesta?'],
    ['Sobre el proyecto', 'Sobre el Proyecto'],
    ['Equipo de trabajo', 'Equipo de Trabajo'],
    ['Ficha técnica', 'Ficha Técnica'],
    ['Así funciona el panel', 'Así Funciona el Panel'],
    ['Explora los temas principales', 'Explora los Temas Principales'],
    ['Principales hallazgos', 'Principales Hallazgos'],
    ['inteligencia artificial', 'Inteligencia Artificial'],
    ['consumo mediático', 'Consumo Mediático'],
  ])('%s → %s', (entrada, salida) => {
    expect(titulo(entrada)).toBe(salida);
  });

  it('la primera palabra siempre va en mayúscula, aunque sea menor', () => {
    expect(titulo('el panel y la muestra')).toBe('El Panel y la Muestra');
    expect(titulo('¿por qué es importante?')).toBe('¿Por Qué Es Importante?');
  });

  it('pone en minúscula las palabras menores escritas con mayúscula', () => {
    expect(titulo('Resultados De La Encuesta')).toBe('Resultados de la Encuesta');
  });

  it('respeta siglas, guiones y signos', () => {
    expect(titulo('datos del CNEP')).toBe('Datos del CNEP');
    expect(titulo('región amazonía-orinoquía')).toBe('Región Amazonía-Orinoquía');
    expect(titulo('qué puede decir: la encuesta')).toBe('Qué Puede Decir: La Encuesta');
  });

  it('es idempotente', () => {
    const t = titulo('¿Cómo se hizo la encuesta?');
    expect(titulo(t)).toBe(t);
  });
});
