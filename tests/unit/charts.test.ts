import { describe, expect, it } from 'vitest';
import {
  dominioAjustado,
  indiceExtremo,
  ordenarBarras,
  posPct,
  segmentosApilados,
  slopeLayout,
  ticksEscala,
  waffleCells,
  waffleSize,
} from '../../src/lib/charts';

describe('posPct', () => {
  it('mapea y recorta a 0–100', () => {
    expect(posPct(5, 0, 10)).toBe(50);
    expect(posPct(0, -4, 4)).toBe(50);
    expect(posPct(-1, 0, 10)).toBe(0);
    expect(posPct(11, 0, 10)).toBe(100);
  });
});

describe('waffle', () => {
  it('100 celdas, llenas = valor redondeado', () => {
    expect(waffleCells(26.5)).toHaveLength(100);
    expect(waffleCells(26.5).filter((c) => c.lleno)).toHaveLength(27);
    expect(waffleCells(-3).filter((c) => c.lleno)).toHaveLength(0);
    expect(waffleCells(140).filter((c) => c.lleno)).toHaveLength(100);
  });

  it('viewBox coherente con las celdas', () => {
    const { w, h } = waffleSize();
    const last = waffleCells(0).at(-1)!;
    expect(last.x + 10).toBe(w);
    expect(last.y + 10).toBe(h);
  });
});

describe('ticksEscala', () => {
  it('enteros para escalas cortas', () => {
    expect(ticksEscala(0, 5)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(ticksEscala(-4, 4)).toHaveLength(9);
    expect(ticksEscala(0, 100)).toEqual([0, 20, 40, 60, 80, 100]);
  });
});

describe('barras y apilada', () => {
  it('ordena de mayor a menor sin mutar', () => {
    const d = [
      { key: 'a', label: 'A', valor: 1 },
      { key: 'b', label: 'B', valor: 3 },
    ];
    expect(ordenarBarras(d).map((x) => x.key)).toEqual(['b', 'a']);
    expect(d[0]!.key).toBe('a');
  });

  it('segmentos suman 100 aunque los datos no', () => {
    const s = segmentosApilados([{ valor: 33 }, { valor: 33 }, { valor: 35 }]);
    expect(s.at(-1)!.x0 + s.at(-1)!.ancho).toBeCloseTo(100);
    expect(s[1]!.x0).toBeCloseTo(s[0]!.ancho);
    expect(segmentosApilados([{ valor: 0 }])).toEqual([]);
  });
});

describe('dominioAjustado', () => {
  it('queda dentro de la escala y contiene los datos', () => {
    const datos = [
      { valor: 3.1, ic: 0.2 },
      { valor: 3.9, ic: 0.3 },
    ];
    const [lo, hi] = dominioAjustado(datos, 0, 5);
    expect(lo).toBeGreaterThanOrEqual(0);
    expect(hi).toBeLessThanOrEqual(5);
    expect(lo).toBeLessThan(2.9);
    expect(hi).toBeGreaterThan(4.2);
  });

  it('respeta un ancho mínimo y recorta en los bordes', () => {
    const [lo, hi] = dominioAjustado([{ valor: 99 }], 0, 100);
    expect(hi).toBe(100);
    expect(hi - lo).toBeGreaterThanOrEqual(20 - 1e-9);
  });
});

describe('indiceExtremo', () => {
  it('elige el grupo más alejado del resto', () => {
    expect(indiceExtremo([47.5, 34.5, 24.1, 20.8])).toBe(0);
    expect(indiceExtremo([5, 5, 9])).toBe(2);
    expect(indiceExtremo([])).toBe(-1);
  });
});

describe('slopeLayout', () => {
  const serie = [
    { label: 'R1', valor: 7.8, ic: 0.2 },
    { label: 'R2', valor: 8.5, ic: 0.2 },
    { label: 'R3', valor: 9.1, ic: 0.2 },
  ];

  it('x reparte las rondas; y crece hacia arriba', () => {
    const { puntos, path } = slopeLayout(serie, 0, 10, 150);
    expect(puntos.map((p) => p.x)).toEqual([14, 50, 86]);
    expect(puntos[2]!.y).toBeLessThan(puntos[0]!.y);
    expect(path.startsWith('M')).toBe(true);
    for (const p of puntos) {
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(150);
    }
  });

  it('una sola ronda queda centrada', () => {
    expect(slopeLayout(serie.slice(0, 1), 0, 10, 150).puntos[0]!.x).toBe(50);
  });
});
