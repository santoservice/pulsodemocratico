import { describe, expect, it } from 'vitest';
import { preguntasQuiz, quiz } from '../../src/data/quiz';
import { temas } from '../../src/data/temas';
import { PCT_SEPARADOR } from '../../src/lib/format';
import {
  DE_LOS_ENCUESTADOS,
  PROMEDIO_ENCUESTADOS,
  evaluarRespuesta,
  pctGrupoDesdeDistribucion,
  pctMismaRespuesta,
  posicionEnEscala,
  promedioDesdeDistribucion,
  rangoPregunta,
  resumenFinal,
  textoMismaRespuesta,
  valoresPregunta,
  type PreguntaQuiz,
} from '../../src/lib/quiz';

/** Los % llevan espacio duro (format.PCT_SEPARADOR). */
const nb = (s: string) => s.replace(/ %/g, `${PCT_SEPARADOR}%`);

const escala = (over: Partial<PreguntaQuiz> = {}): PreguntaQuiz => ({
  id: 'esc',
  tema: 'populismo',
  temaTitulo: 'Populismo',
  texto: 't',
  tipo: 'escala',
  min: 0,
  max: 10,
  etiquetasExtremos: ['a', 'b'],
  comparacion: { modo: 'promedio', valor: 5 },
  distribucion: [
    { valor: 0, n: 10 },
    { valor: 5, n: 30 },
    { valor: 10, n: 60 },
  ],
  n: 100,
  ronda: '3.ª ronda',
  fuente: 'test',
  ...over,
});

const opciones = (over: Partial<PreguntaQuiz> = {}): PreguntaQuiz => ({
  id: 'opc',
  tema: 'desinformacion',
  temaTitulo: 'Desinformación',
  texto: 't',
  tipo: 'opciones',
  opciones: [
    { valor: 1, etiqueta: 'Nunca' },
    { valor: 2, etiqueta: 'Casi nunca' },
    { valor: 3, etiqueta: 'Algunas veces' },
    { valor: 4, etiqueta: 'Con frecuencia' },
  ],
  comparacion: {
    modo: 'porcentaje',
    valoresGrupo: [3, 4],
    valor: 79.7,
    descripcionGrupo: 've noticias falsas',
    descripcionFuera: 'casi no las ve',
    etiquetaGrupo: 'Sí',
    etiquetaFuera: 'No',
  },
  distribucion: [
    { valor: 1, n: 112 },
    { valor: 2, n: 103 },
    { valor: 3, n: 436 },
    { valor: 4, n: 408 },
  ],
  n: 1059,
  ronda: '3.ª ronda',
  fuente: 'test',
  ...over,
});

describe('valores y escala', () => {
  it('valores de escala y de opciones', () => {
    expect(valoresPregunta(escala({ min: 0, max: 5 }))).toEqual([0, 1, 2, 3, 4, 5]);
    expect(valoresPregunta(opciones())).toEqual([1, 2, 3, 4]);
    expect(rangoPregunta(opciones())).toEqual([1, 4]);
  });

  it('posición 0–100 con recorte', () => {
    const p = escala();
    expect(posicionEnEscala(p, 0)).toBe(0);
    expect(posicionEnEscala(p, 10)).toBe(100);
    expect(posicionEnEscala(p, 2.5)).toBe(25);
    expect(posicionEnEscala(p, 12)).toBe(100);
    expect(posicionEnEscala(opciones(), 4)).toBe(100);
  });
});

describe('evaluarRespuesta · promedio', () => {
  it('mínimo: por debajo, con diferencia y frase', () => {
    const e = evaluarRespuesta(escala(), 0);
    expect(e.posicion).toBe('por debajo');
    expect(e.diferencia).toBe(-5);
    expect(e.dentroDelGrupo).toBeUndefined();
    expect(e.texto).toBe(`Estás 5,0 puntos por debajo del ${PROMEDIO_ENCUESTADOS}.`);
  });

  it('máximo: por encima', () => {
    const e = evaluarRespuesta(escala(), 10);
    expect(e.posicion).toBe('por encima');
    expect(e.texto).toContain('por encima del promedio de los encuestados');
  });

  it('igual dentro del umbral (8 % del rango) y singular "punto"', () => {
    expect(evaluarRespuesta(escala(), 5).posicion).toBe('igual');
    expect(evaluarRespuesta(escala(), 5).texto).toBe(
      'Estás prácticamente en el promedio de los encuestados.',
    );
    const p = escala({ comparacion: { modo: 'promedio', valor: 4 } });
    expect(evaluarRespuesta(p, 5).texto).toBe(
      'Estás 1,0 punto por encima del promedio de los encuestados.',
    );
  });

  it('rechaza valores fuera de la escala o no enteros', () => {
    expect(() => evaluarRespuesta(escala(), 11)).toThrow();
    expect(() => evaluarRespuesta(escala(), 2.5)).toThrow();
    expect(() => evaluarRespuesta(opciones(), 0)).toThrow();
  });
});

describe('evaluarRespuesta · porcentaje', () => {
  it('dentro del grupo', () => {
    const e = evaluarRespuesta(opciones(), 3);
    expect(e.dentroDelGrupo).toBe(true);
    expect(e.etiqueta).toBe('Algunas veces');
    expect(e.texto).toBe(nb(`Haces parte del 80 % ${DE_LOS_ENCUESTADOS} que ve noticias falsas.`));
  });

  it('fuera del grupo (complemento)', () => {
    const e = evaluarRespuesta(opciones(), 1);
    expect(e.dentroDelGrupo).toBe(false);
    expect(e.posicion).toBe('por debajo');
    expect(e.texto).toBe(nb(`Haces parte del 20 % ${DE_LOS_ENCUESTADOS} que casi no las ve.`));
  });

  it('bordes del grupo', () => {
    expect(evaluarRespuesta(opciones(), 2).dentroDelGrupo).toBe(false);
    expect(evaluarRespuesta(opciones(), 4).dentroDelGrupo).toBe(true);
  });
});

describe('% misma respuesta', () => {
  it('desde la distribución', () => {
    expect(pctMismaRespuesta(escala(), 10)).toBe(60);
    expect(pctMismaRespuesta(escala(), 3)).toBe(0);
    expect(evaluarRespuesta(opciones(), 3).textoMismaRespuesta).toBe(
      nb('El 41 % de los encuestados respondió lo mismo que tú.'),
    );
  });

  it('casos extremos de la frase', () => {
    expect(textoMismaRespuesta(0)).toMatch(/^Nadie/);
    expect(textoMismaRespuesta(0.2)).toMatch(/^Menos del 1/);
    expect(textoMismaRespuesta(76.8)).toBe(
      nb('El 77 % de los encuestados respondió lo mismo que tú.'),
    );
  });
});

describe('resumenFinal', () => {
  const ps = [
    opciones(),
    escala({ id: 'a', temaTitulo: 'Populismo' }),
    escala({ id: 'b', temaTitulo: 'Polarización' }),
  ];

  it('una evaluación por respuesta y frase por posición', () => {
    const r = resumenFinal(ps, { opc: 4, a: 10, b: 0 });
    expect(r.respondidas).toBe(3);
    expect(r.total).toBe(3);
    expect(r.evaluaciones.map((e) => e.preguntaId)).toEqual(['opc', 'a', 'b']);
    expect(r.texto).toBe(
      'Frente al promedio de los encuestados, estás por encima en populismo y por debajo en polarización.',
    );
  });

  it('omite preguntas sin respuesta', () => {
    const r = resumenFinal(ps, { a: 5, b: null });
    expect(r.respondidas).toBe(1);
    expect(r.texto).toBe('Frente al promedio de los encuestados, estás muy cerca en populismo.');
    expect(resumenFinal(ps, {}).texto).toBe('');
  });
});

describe('config del quiz (datos_test.xlsx)', () => {
  it('4 preguntas en el orden del cliente, con temas existentes', () => {
    expect(preguntasQuiz.map((p) => p.tema)).toEqual([
      'desinformacion',
      'populismo',
      'polarizacion',
      'inteligencia-artificial',
    ]);
    const slugs = new Set(temas.map((t) => t.slug as string));
    for (const p of preguntasQuiz) expect(slugs.has(p.tema)).toBe(true);
    expect(quiz.provisional).toBe(true);
  });

  it('n, % y promedios coinciden con la distribución', () => {
    for (const p of preguntasQuiz) {
      expect(p.distribucion.reduce((a, d) => a + d.n, 0)).toBe(p.n);
      expect(p.distribucion.map((d) => d.valor)).toEqual(valoresPregunta(p));
      const c = p.comparacion;
      if (c.modo === 'porcentaje') {
        expect(c.valor).toBeCloseTo(pctGrupoDesdeDistribucion(p, c.valoresGrupo), 6);
      } else {
        expect(c.valor).toBeCloseTo(promedioDesdeDistribucion(p), 6);
      }
    }
  });

  it('cifras clave del Excel', () => {
    const [des, pop, pol, ia] = preguntasQuiz;
    expect(des!.comparacion.valor).toBeCloseTo(79.7, 1);
    expect(pop!.comparacion.valor).toBeCloseTo(4.21, 2);
    expect(pol!.comparacion.valor).toBeCloseTo(0.71, 2);
    expect(ia!.comparacion.valor).toBeCloseTo(37.5, 1);
    expect(pctMismaRespuesta(pol!, 0)).toBeCloseTo(76.8, 1);
    expect(promedioDesdeDistribucion(ia!)).toBeCloseTo(2.61, 2);
  });

  it('nunca dice "nacional" ni "colombianos"', () => {
    const r = resumenFinal(preguntasQuiz, {
      desinformacion: 1,
      populismo: 0,
      polarizacion: 10,
      'inteligencia-artificial': 5,
    });
    const todo = [r.texto, ...r.evaluaciones.flatMap((e) => [e.texto, e.textoMismaRespuesta])];
    for (const t of todo) expect(t).not.toMatch(/nacional|colombian/i);
    expect(JSON.stringify(quiz)).not.toMatch(/nacional/i);
  });
});
