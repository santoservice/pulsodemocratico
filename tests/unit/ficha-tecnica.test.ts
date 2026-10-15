import { describe, expect, it } from 'vitest';
import { PANEL_COMPLETO, fichaTecnica, rondas } from '../../src/data/ficha-tecnica';

describe('ficha técnica', () => {
  it('tiene las 8 cajas del documento del cliente, en orden', () => {
    expect(fichaTecnica.map((f) => f.titulo)).toEqual([
      'Objetivo del estudio',
      'Realizado por',
      'Población de referencia',
      'Cobertura geográfica',
      'Tipo de estudio',
      'Trabajo de campo',
      'Selección de participantes',
      'Método de recolección',
    ]);
  });

  it('ids únicos y textos sin espacios sobrantes', () => {
    expect(new Set(fichaTecnica.map((f) => f.id)).size).toBe(fichaTecnica.length);
    for (const f of fichaTecnica) expect(f.texto).toBe(f.texto.trim());
  });

  it('"Realizado por" conserva el texto del cliente', () => {
    expect(fichaTecnica[1].texto).toBe(
      'Universidad de Wisconsin, Universidad Externado de Colombia, Universitat Pompeu Fabra y Universidad de La Sabana.',
    );
  });
});

describe('rondas del panel', () => {
  it('participantes y preguntas por ronda', () => {
    expect(rondas.map((r) => [r.personas, r.preguntas])).toEqual([
      [2008, 190],
      [1492, 160],
      [1175, 170],
    ]);
  });

  it('el panel completo es menor que la ronda más pequeña', () => {
    expect(PANEL_COMPLETO).toBe(1081);
    expect(PANEL_COMPLETO).toBeLessThanOrEqual(Math.min(...rondas.map((r) => r.personas)));
  });
});
