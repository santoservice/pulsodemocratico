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
