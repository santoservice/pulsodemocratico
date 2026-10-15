import { describe, expect, it } from 'vitest';
import {
  crucesModal,
  filasTecnicas,
  formatoP,
  fraseCruceTecnica,
  idDetalle,
  listaControles,
  serieModal,
} from '../../src/lib/detalle';
import { cruceSignificativo, getIndicadores, getJovenes, type Cruce } from '../../src/lib/tablero';

const conCruces = getIndicadores().find((i) => crucesModal(i).length >= 2)!;

describe('textos del detalle técnico', () => {
  it('lista de controles en español', () => {
    expect(listaControles(['sexo', 'region'])).toBe('sexo y región');
    expect(listaControles(['sexo', 'edad', 'educ', 'region'])).toBe(
      'sexo, edad, nivel de estudios y región',
    );
    expect(listaControles(['edad'])).toBe('edad');
    expect(listaControles([])).toBe('');
  });

  it('p-valor legible', () => {
    expect(formatoP(0.0004)).toBe('menor que 0,001');
    expect(formatoP(0.03124)).toBe('0,031');
  });

  it('frase de un cruce real', () => {
    const c = crucesModal(conCruces)[0]!;
    const f = fraseCruceTecnica(c, conCruces.stat);
    expect(f).toContain(c.socio_label);
    expect(f).toMatch(/Prueba (ji cuadrado|F)/);
    expect(f).toContain('Se mantiene al comparar personas de igual');
    expect(f).not.toMatch(/\d\.\d{1,2}(?!\d)/); // decimales con coma (el punto solo separa miles)
  });

  it('cruce que no se mantiene con controles', () => {
    const c: Cruce = {
      ...crucesModal(conCruces)[0]!,
      aj: { ...crucesModal(conCruces)[0]!.aj, significativo: false, p: 0.2 },
    };
    expect(fraseCruceTecnica(c, 'pct')).toContain('No se mantiene');
  });
});

describe('contenido del modal', () => {
  it('ids y filas técnicas', () => {
    expect(idDetalle('grupo-cm')).toBe('detalle-grupo-cm');
    const filas = filasTecnicas(conCruces);
    expect(filas[0]!.etiqueta).toBe('Ronda del dato');
    expect(filas[0]!.valor).toMatch(/ronda \(Ola/);
    expect(filas.find((f) => f.etiqueta === 'Personas que respondieron')).toBeDefined();
  });

  it('serie: panel si hay ≥ 2 rondas, si no la general, null si una ronda', () => {
    for (const ind of getIndicadores()) {
      const s = serieModal(ind);
      if (ind.serie_panel && ind.serie_panel.length > 1) expect(s?.fuente).toBe('panel');
      else if (ind.serie.length > 1) expect(s?.fuente).toBe('serie');
      else expect(s).toBeNull();
    }
  });

  it('solo cruces publicables, con edad primero en Jóvenes', () => {
    for (const ind of getIndicadores()) {
      for (const c of crucesModal(ind)) expect(cruceSignificativo(c)).toBe(true);
    }
    for (const d of getJovenes()) expect(crucesModal(d.indicador, 'edad')[0]!.socio).toBe('edad');
  });
});
