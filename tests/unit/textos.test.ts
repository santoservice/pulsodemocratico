import { describe, expect, it } from 'vitest';
import {
  getIndicador,
  getIndicadores,
  getJovenes,
  getTarjetasDestacadas,
  getTarjetasTema,
  getTemas,
  type Indicador,
} from '../../src/lib/tablero';
import {
  brechaMostrada,
  etiquetaCorta,
  fraseCambio,
  fraseIndicador,
  fraseMedia,
  frasePct,
  predicadoPlural,
  resumenJovenes,
  resumenTarjeta,
  sufijoEscala,
  titularIndicador,
  titularJovenes,
  titularTarjeta,
} from '../../src/lib/textos';

// "periódicos nacionales" es válido; "nacional" como afirmación sobre la población, no.
const PROHIBIDO = /colombian[oa]s|\bnacional\b|del país|margen de error/i;

const todasLasFrases = (): string[] => [
  ...getTemas().flatMap((t) => getTarjetasTema(t.key).map(resumenTarjeta)),
  ...getTarjetasDestacadas().map(resumenTarjeta),
  ...getIndicadores().map(fraseIndicador),
  ...getIndicadores().flatMap((i) => fraseCambio(i) ?? []),
  ...getJovenes().map(resumenJovenes),
];

describe('frases: reglas de redacción', () => {
  it('nunca afirman sobre la población (colombianos / nacional / del país)', () => {
    for (const f of todasLasFrases()) expect(f).not.toMatch(PROHIBIDO);
  });

  it('no tienen huecos ni valores sin formato', () => {
    for (const f of todasLasFrases()) {
      expect(f).not.toMatch(/undefined|null|NaN/);
      // Decimales con coma (es-CO), nunca "4.9".
      expect(f).not.toMatch(/\d\.\d/);
      expect(f.trim()).toMatch(/[.)]$/);
    }
  });
});

describe('frasePct / predicadoPlural', () => {
  it('pluraliza el verbo inicial', () => {
    expect(predicadoPlural('Se ubica en la izquierda')).toBe('se ubican en la izquierda');
    expect(predicadoPlural('Usa TikTok con frecuencia')).toBe('usan TikTok con frecuencia');
    expect(predicadoPlural('No distingue si un mensaje lo escribió una IA')).toBe(
      'no distinguen si un mensaje lo escribió una IA',
    );
    expect(predicadoPlural('Se siente cercano a algún partido')).toBe(
      'se sienten cercanos a algún partido',
    );
    expect(predicadoPlural('Simpatía hacia Gustavo Petro')).toBeNull();
  });

  it('"X de cada 100 encuestados …"', () => {
    const i = getIndicador('lr_izq')!;
    expect(frasePct(i, 26.5)).toBe('27 de cada 100 encuestados se ubican en la izquierda.');
    expect(frasePct(getIndicador('pop_hablan')!, 76)).toMatch(
      /^76 de cada 100 encuestados están de acuerdo con la frase «/,
    );
  });
});

describe('fraseMedia', () => {
  it('ubica el promedio respecto a los polos', () => {
    const i = getIndicador('outdislike')!;
    expect(fraseMedia(i, 9.1)).toBe(
      'En promedio, las personas encuestadas marcan 9,1 de 10: muy cerca de «Rechazo total».',
    );
    expect(fraseMedia(i, 5)).toMatch(/a medio camino entre/);
    expect(fraseMedia(i, 3)).toMatch(/más cerca de «Ningún rechazo»/);
  });

  it('escala con negativos', () => {
    expect(sufijoEscala(getIndicador('discernimiento')!)).toBe('en una escala de −4 a +4');
    expect(sufijoEscala(getIndicador('cinismo')!)).toBe('de 5');
  });
});

describe('fraseCambio', () => {
  const base = getIndicador('outdislike')!;
  const mk = (a: number, b: number): Indicador => ({
    ...base,
    serie_panel: [
      { ...base.serie_panel![0]!, valor: a, ic: 0.2 },
      { ...base.serie_panel![2]!, valor: b, ic: 0.2 },
    ],
  });

  it('subió / bajó / estable / una sola ronda', () => {
    expect(fraseCambio(mk(7, 9))).toBe('Subió 2,0 puntos desde la 1.ª ronda.');
    expect(fraseCambio(mk(9, 7))).toBe('Bajó 2,0 puntos desde la 1.ª ronda.');
    expect(fraseCambio(mk(7, 7.1))).toBe('Sin cambios claros entre rondas.');
    expect(fraseCambio(getIndicador('cm_tv')!)).toBeNull();
  });

  it('porcentajes en puntos enteros', () => {
    const i = getIndicador('lr_centro')!;
    expect(fraseCambio(i)).toMatch(/^Bajó \d+ puntos desde la 1\.ª ronda\.$/);
  });
});

describe('titulares', () => {
  it('pct → "27 %"; media → "4,9" + "de 10"', () => {
    expect(titularIndicador(getIndicador('lr_izq')!).valor).toBe('33\u00a0%');
    expect(titularIndicador(getIndicador('outdislike')!)).toEqual({
      valor: '9,1',
      sufijo: 'de 10',
    });
  });

  it('todas las tarjetas tienen titular y resumen', () => {
    for (const t of getTemas()) {
      for (const x of getTarjetasTema(t.key)) {
        expect(titularTarjeta(x).valor).toMatch(/\d/);
        expect(resumenTarjeta(x).length).toBeGreaterThan(10);
      }
    }
  });

  it('jóvenes: brecha con signo', () => {
    for (const d of getJovenes()) {
      expect(titularJovenes(d).valor).toMatch(d.brecha >= 0 ? /^\+/ : /^−/);
      expect(resumenJovenes(d)).toMatch(/^Los jóvenes de 18 a 30 años marcan/);
    }
  });

  it('jóvenes: la brecha cuadra con los valores redondeados que se muestran', () => {
    for (const d of getJovenes().filter((x) => x.indicador.stat === 'pct')) {
      const diff = Math.round(d.joven.valor) - Math.round(d.resto);
      expect(brechaMostrada(d)).toBe(diff);
    }
  });
});

describe('etiquetaCorta', () => {
  it('quita el prefijo común del grupo', () => {
    expect(etiquetaCorta(getIndicador('rs_tk')!)).toBe('TikTok');
    expect(etiquetaCorta(getIndicador('cm_tv')!)).toBe('Noticieros de televisión');
    expect(etiquetaCorta(getIndicador('th_petro')!)).toBe('Gustavo Petro');
    expect(etiquetaCorta(getIndicador('fk1')!)).toBe('Petro y alias «Fito»');
  });
});
