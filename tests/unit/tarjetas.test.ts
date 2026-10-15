import { describe, expect, it } from 'vitest';
import {
  chartKindFor,
  getDestacados,
  getIndicador,
  getIndicadores,
  getTarjetasDestacadas,
  getTarjetasTema,
  getTemas,
  grupoBarrasFor,
  tarjetaIndicador,
} from '../../src/lib/tablero';

describe('getTarjetasTema', () => {
  for (const t of getTemas()) {
    it(`${t.key}: cada indicador aparece exactamente una vez`, () => {
      const tarjetas = getTarjetasTema(t.key);
      const keys = tarjetas.flatMap((x) => x.indicadores.map((i) => i.key));
      expect(new Set(keys).size).toBe(keys.length);
      expect([...keys].sort()).toEqual(
        getIndicadores(t.key)
          .map((i) => i.key)
          .sort(),
      );
      expect(new Set(tarjetas.map((x) => x.id)).size).toBe(tarjetas.length);
      expect(tarjetas.every((x) => x.tema === t.key && x.indicadores.length > 0)).toBe(true);
    });
  }

  it('agrupa barras, ideología y termómetros en una sola tarjeta', () => {
    const pol = getTarjetasTema('polarizacion');
    expect(pol.filter((x) => x.tipo === 'stacked')).toHaveLength(1);
    expect(pol.filter((x) => x.tipo === 'thermometer')).toHaveLength(1);
    expect(pol.find((x) => x.tipo === 'stacked')!.indicadores.map((i) => i.key)).toEqual([
      'lr_izq',
      'lr_centro',
      'lr_der',
    ]);
    const consumo = getTarjetasTema('consumo');
    expect(consumo.map((x) => x.id)).toEqual(['grupo-cm', 'grupo-rs']);
  });

  it('las tarjetas agrupadas son homogéneas (mismo tipo de gráfica y mismo grupo)', () => {
    for (const t of getTemas()) {
      for (const x of getTarjetasTema(t.key)) {
        for (const i of x.indicadores) {
          expect(chartKindFor(i)).toBe(x.tipo);
          if (x.tipo === 'bars') expect(grupoBarrasFor(i)).toBe(x.grupo);
        }
        if (x.tipo === 'waffle' || x.tipo === 'scale') expect(x.indicadores).toHaveLength(1);
      }
    }
  });

  it('respeta el orden del JSON (el grupo ocupa la posición de su primer miembro)', () => {
    expect(getTarjetasTema('polarizacion')[0]!.id).toBe('ideologia');
    expect(getTarjetasTema('desinformacion')[0]!.id).toBe('desinf_frec');
  });

  it('marca como destacada la tarjeta si algún miembro lo es', () => {
    const rs = getTarjetasTema('consumo').find((x) => x.id === 'grupo-rs')!;
    expect(rs.destacado).toBe(true);
  });
});

describe('tarjetas destacadas', () => {
  it('una tarjeta por indicador destacado, de un solo indicador', () => {
    const d = getTarjetasDestacadas();
    expect(d).toHaveLength(getDestacados().length);
    expect(d.every((x) => x.indicadores.length === 1 && x.destacado)).toBe(true);
    expect(d.every((x) => x.tipo === 'waffle' || x.tipo === 'scale')).toBe(true);
  });

  it('tarjetaIndicador usa waffle para pct agrupados (rs_tk)', () => {
    expect(tarjetaIndicador(getIndicador('rs_tk')!).tipo).toBe('waffle');
    expect(tarjetaIndicador(getIndicador('th_petro')!).tipo).toBe('scale');
  });

  it('respeta el orden de temas pedido', () => {
    const d = getTarjetasDestacadas(['ia', 'polarizacion']);
    expect(d[0]!.tema).toBe('ia');
    expect(d.at(-1)!.tema).toBe('polarizacion');
  });
});
