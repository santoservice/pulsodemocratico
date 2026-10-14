import { describe, expect, it } from 'vitest';
import raw from '../../src/data/tablero.json';
import { rondas } from '../../src/data/ficha-tecnica';
import { parseTablero, tableroSchema } from '../../src/lib/schema';
import {
  chartKindFor,
  cruceSignificativo,
  getCambioRondas,
  getCrucesSignificativos,
  getDestacados,
  getFamilias,
  getIndicador,
  getIndicadores,
  getJovenes,
  getMeta,
  getStats,
  getTema,
  getTemas,
  getUltimoValor,
  grupoBarrasFor,
  type Indicador,
} from '../../src/lib/tablero';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

describe('schema', () => {
  it('acepta el tablero real', () => {
    expect(tableroSchema.safeParse(raw).success).toBe(true);
  });

  it('falla con un mensaje claro si falta un campo', () => {
    const bad = clone(raw) as { indicadores: Array<Record<string, unknown>> };
    delete bad.indicadores[0]!.stat;
    expect(() => parseTablero(bad)).toThrow(/indicadores\.0\.stat/);
  });

  it('rechaza claves de indicador duplicadas y temas inexistentes', () => {
    const bad = clone(raw) as { indicadores: Array<{ key: string; tema: string }> };
    bad.indicadores[1]!.key = bad.indicadores[0]!.key;
    bad.indicadores[2]!.tema = 'otro';
    expect(() => parseTablero(bad)).toThrow(/duplicado|tema/);
  });
});

describe('helpers básicos', () => {
  it('cuenta temas e indicadores', () => {
    expect(getTemas()).toHaveLength(5);
    expect(getIndicadores()).toHaveLength(53);
    expect(getIndicadores().filter((i) => i.stat === 'pct')).toHaveLength(30);
    expect(getIndicadores().filter((i) => i.stat === 'media')).toHaveLength(23);
    const total = getTemas().reduce((a, t) => a + getIndicadores(t.key).length, 0);
    expect(total).toBe(53);
  });

  it('getTema / getIndicador', () => {
    expect(getTema('ia')?.key).toBe('ia');
    expect(getIndicador('wpip')?.tema).toBe('polarizacion');
    expect(getIndicador('no-existe')).toBeUndefined();
  });

  it('destacados', () => {
    expect(getDestacados().length).toBeGreaterThan(0);
    expect(getDestacados().every((i) => i.destacado)).toBe(true);
    expect(getDestacados('ia').every((i) => i.tema === 'ia')).toBe(true);
  });

  it('familias conservan orden y cubren todo el tema', () => {
    for (const t of getTemas()) {
      const fams = getFamilias(t.key);
      // Las familias no siempre son contiguas en el JSON (p. ej. "fake"): mismo contenido.
      const keys = (xs: { key: string }[]) => xs.map((i) => i.key).sort();
      expect(keys(fams.flatMap((f) => f.indicadores))).toEqual(keys(getIndicadores(t.key)));
      expect(new Set(fams.map((f) => f.familia)).size).toBe(fams.length);
    }
    expect(getFamilias('polarizacion')[0]).toMatchObject({ familia: 'ideologia' });
    expect(getFamilias('polarizacion')[0]!.indicadores.map((i) => i.key)).toEqual([
      'lr_izq',
      'lr_centro',
      'lr_der',
    ]);
  });

  it('último valor = última ronda de la serie', () => {
    const i = getIndicador('outdislike')!;
    expect(getUltimoValor(i).ola).toBe('w2');
  });

  it('stats del inicio', () => {
    expect(getStats()).toEqual({ rondas: 3, personas: 2008, preguntas: 53, regiones: 4 });
  });

  it('rondas de la ficha coinciden con meta.n_olas', () => {
    const { n_olas } = getMeta();
    for (const r of rondas) expect(r.personas).toBe(n_olas[r.ola]);
  });
});

describe('significancia', () => {
  it('requiere significativo && aj.significativo', () => {
    const c = getIndicador('lr_izq')!.cruces.edad!;
    expect(cruceSignificativo(c)).toBe(true);
    expect(cruceSignificativo({ ...c, aj: { ...c.aj, significativo: false } })).toBe(false);
    expect(cruceSignificativo({ ...c, significativo: false })).toBe(false);
    expect(cruceSignificativo(undefined)).toBe(false);
  });

  it('el total de cruces publicables coincide con meta.n_publicables', () => {
    const n = getIndicadores().reduce((a, i) => a + getCrucesSignificativos(i).length, 0);
    expect(n).toBe(getMeta().n_publicables);
  });

  it('ordena por prioridad de la variable socio', () => {
    const cs = getCrucesSignificativos(getIndicador('rs_ig')!);
    expect(cs.map((c) => c.socio)).toEqual(['edad', 'sexo', 'educ', 'estrato']);
  });
});

describe('cambio entre rondas', () => {
  it('null si solo hay una ronda', () => {
    expect(getCambioRondas(getIndicador('cm_tv')!)).toBeNull();
  });

  it('usa serie_panel cuando existe', () => {
    const c = getCambioRondas(getIndicador('outdislike')!)!;
    expect(c.fuente).toBe('panel');
    expect(c.delta).toBeCloseTo(c.hasta.valor - c.desde.valor);
  });

  it('clasifica según el IC de la diferencia', () => {
    const base = getIndicador('outdislike')!;
    const mk = (a: number, b: number, ic: number): Indicador => ({
      ...base,
      serie_panel: [
        { ...base.serie_panel![0]!, valor: a, ic },
        { ...base.serie_panel![0]!, valor: b, ic },
      ],
    });
    expect(getCambioRondas(mk(5, 6, 0.3))!.direccion).toBe('sube');
    expect(getCambioRondas(mk(6, 5, 0.3))!.direccion).toBe('baja');
    expect(getCambioRondas(mk(5, 5.3, 0.3))!.direccion).toBe('estable');
  });
});

describe('jóvenes', () => {
  const j = getJovenes();

  it('no está vacío y solo incluye cruces de edad publicables', () => {
    expect(j.length).toBeGreaterThan(0);
    for (const x of j) {
      expect(cruceSignificativo(x.indicador.cruces.edad)).toBe(true);
      expect(x.joven.cat).toBe('18 a 30 años');
      expect(x.direccion).toBe(x.brecha >= 0 ? 'más' : 'menos');
    }
  });

  it('ordenado por brecha relativa descendente', () => {
    for (let k = 1; k < j.length; k++) {
      expect(j[k - 1]!.brechaRel).toBeGreaterThanOrEqual(j[k]!.brechaRel);
    }
  });
});

describe('chartKindFor', () => {
  it('asigna una gráfica a los 53 indicadores', () => {
    const kinds = ['waffle', 'scale', 'bars', 'stacked', 'thermometer'];
    for (const i of getIndicadores()) expect(kinds).toContain(chartKindFor(i));
  });

  it('reglas de PLAN §5.2', () => {
    expect(chartKindFor(getIndicador('lr_centro')!)).toBe('stacked');
    expect(chartKindFor(getIndicador('th_petro')!)).toBe('thermometer');
    expect(chartKindFor(getIndicador('cm_tv')!)).toBe('bars');
    expect(chartKindFor(getIndicador('rs_tk')!)).toBe('bars');
    expect(chartKindFor(getIndicador('desinf_frec')!)).toBe('waffle');
    expect(chartKindFor(getIndicador('wpip')!)).toBe('scale');
    expect(grupoBarrasFor(getIndicador('rs_tk')!)).toBe('rs');
    expect(grupoBarrasFor(getIndicador('wpip')!)).toBeNull();
  });
});
