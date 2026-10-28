/**
 * Los 6 "Hallazgos principales" del visor (uno por tema): van en /resultados y en
 * "Explora los temas" del Inicio. Cada uno define su gráfica, la leyenda, el texto de
 * "¿Cómo se midió?" y las tablas de "Los datos del gráfico", con los mismos textos y
 * cálculos del visor de los investigadores (docs/Visor hallazgos CNEP Colombia 2026.html).
 */
import type { HallazgoVisor, RondaColumna } from './tipos';
import {
  cambioPts,
  fechaCorta,
  fmt,
  fmtN,
  fmtSigno,
  meta,
  pTexto,
  visor,
  type RondaVisor,
} from './comun';

export type {
  FilaEmbudo,
  FilaMancuerna,
  GraficaVisor,
  HallazgoVisor,
  ItemLeyenda,
  Leyenda,
  RondaColumna,
  Serie,
} from './tipos';

/** Grupos de edad de las gráficas de jóvenes (mismo orden que las series 1 y 2). */
export const GRUPOS_EDAD = [
  { k: 'jovenes', et: '18 a 30 años' },
  { k: 'mayores', et: '31 años o más' },
] as const;

export const SE_MANTIENE = ' «Se mantiene» indica un cambio que no es estadísticamente significativo.';

/** Columnas por ronda a partir de un bloque {rondas, cambios} del visor. */
function rondasColumna(
  G: { rondas: (RondaVisor & { n: number; n_alto: number; pct: number })[]; cambios: { dif_pp: number; p: number }[] },
  tip: (r: { n: number; n_alto: number; pct: number }) => string,
): RondaColumna[] {
  const pct = G.rondas.map((r) => Math.round(r.pct));
  return G.rondas.map((r, i) => ({
    ...r,
    tip: `${r.label} · ${r.fechas}\n${tip(r)}`,
    cambio: i ? cambioPts(pct[i]! - pct[i - 1]!, G.cambios[i - 1]!.p) : undefined,
  }));
}

/* ------------------------------------------------------- 1. Polarización */

export const WAPSV_TEXTO = [
  '<strong>La pregunta.</strong> En cada ronda se pidió calificar de 0 a 10 qué tan favorable se siente hacia los votantes de cada candidato. En la 1.ª y la 2.ª ronda: votantes de Iván Cepeda, Abelardo de la Espriella, Paloma Valencia, Sergio Fajardo, Claudia López y Roy Barreras. En la 3.ª ronda: votantes de Cepeda y De la Espriella.',
  '<strong>El cálculo.</strong> Para cada persona se mide cuánto se alejan sus calificaciones de su calificación promedio. Calificar igual a todos da 0; dar 10 a los votantes de unos y 0 a los de otros se acerca a 5.',
  '<strong>Los pesos.</strong> Cada candidato pesa según su tamaño electoral (índice WAPS de Wagner, del proyecto CNEP).',
];

function polarizacion(): HallazgoVisor {
  const G = visor.polarizacion_alto;
  const P = G.panel;
  const [c1, c2] = G.cambios as [(typeof G.cambios)[number], (typeof G.cambios)[number]];
  const rondas = rondasColumna(
    G,
    (r) => `${fmtN(r.n_alto)} de ${fmtN(r.n)} personas (${fmt(r.pct)} %) puntúan 4 o más`,
  );
  return {
    id: 'pol-alto',
    tema: 'polarizacion',
    etiqueta: 'Polarización',
    titulo: '¿Cuántos ven con buenos ojos solo a los votantes de su candidato?',
    leyenda: {
      items: [
        { texto: 'Solo a los suyos', tipo: 'si' },
        { texto: 'El resto', tipo: 'no' },
      ],
    },
    grafica: {
      tipo: 'columnas',
      aria: `Porcentaje de personas que ven con buenos ojos solo a los votantes de su candidato: ${rondas.map((r) => `${r.label}, ${Math.round(r.pct)} %`).join('; ')}.`,
      rondas,
    },
    metodo: [
      ...WAPSV_TEXTO,
      '<strong>Solo a los suyos.</strong> Personas con 4 o más en esa escala de 0 a 5.',
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(P.n)} personas que tienen el índice en las tres rondas. En la 3.ª ronda se incluye a quienes calificaron a los dos grupos de votantes.`,
      `<strong>El dato.</strong> Porcentaje sin ponderar. El cambio es la diferencia en puntos porcentuales entre una ronda y la siguiente (${fmtSigno(c1.dif_pp)} puntos, ${pTexto(c1.p)}; ${fmtSigno(c2.dif_pp)} puntos, ${pTexto(c2.p)}).${G.cambios.some((c) => c.p >= 0.05) ? SE_MANTIENE : ''}`,
    ],
    fuente: `Fuente: ${meta.fuente} Índice WAPS hacia los votantes (variables WAPSV).`,
    tablas: [
      {
        cabecera: ['Ronda', 'Momento', 'Solo a los suyos', 'Porcentaje', 'Cambio frente a la ronda anterior'],
        numericas: [2, 3, 4],
        filas: G.rondas.map((r, i) => [
          r.label,
          r.contexto,
          `${fmtN(r.n_alto)} de ${fmtN(r.n)}`,
          `${fmt(r.pct)} %`,
          i
            ? { v: `${fmtSigno(G.cambios[i - 1]!.dif_pp)} puntos`, sub: pTexto(G.cambios[i - 1]!.p) }
            : '—',
        ]),
        nota: `Las mismas ${fmtN(P.n)} personas en las tres rondas, sin ponderar.`,
      },
    ],
  };
}

/* ------------------------------------------------------ 2. Desinformación */

function desinformacion(): HallazgoVisor {
  const G = visor.desinformacion_exposicion;
  const P = G.panel;
  const [c1, c2] = G.cambios as [(typeof G.cambios)[number], (typeof G.cambios)[number]];
  const rondas = rondasColumna(
    G,
    (r) => `${fmtN(r.n_alto)} de ${fmtN(r.n)} personas (${fmt(r.pct)} %) responden «con frecuencia»`,
  );
  return {
    id: 'des-exposicion',
    tema: 'desinformacion',
    etiqueta: 'Desinformación',
    titulo: '¿Cuántos sienten que las noticias inventadas los rodean?',
    leyenda: {
      items: [
        { texto: 'Siente que las ve con frecuencia', tipo: 'si' },
        { texto: 'El resto', tipo: 'no' },
      ],
    },
    grafica: {
      tipo: 'columnas',
      aria: `Porcentaje de personas que sienten que ven noticias inventadas con frecuencia: ${rondas.map((r) => `${r.label}, ${Math.round(r.pct)} %`).join('; ')}.`,
      rondas,
    },
    metodo: [
      '<strong>La pregunta.</strong> «Algunas personas definen las noticias falsas como información falsa que es inventada con fines políticos o económicos y que tiene poca o ninguna relación con hechos reales. ¿Qué tan frecuentemente se encuentra con noticias políticas que usted considera son completamente inventadas?» Respuestas: nunca, casi nunca, algunas veces, con frecuencia.',
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(P.n)} personas que respondieron la pregunta en las tres rondas. No se incluye la respuesta «No lo sé».`,
      `<strong>El dato.</strong> Porcentaje que responde «con frecuencia», sin ponderar. El cambio es la diferencia en puntos porcentuales entre una ronda y la siguiente (${fmtSigno(c1.dif_pp)} puntos, ${pTexto(c1.p)}; ${fmtSigno(c2.dif_pp)} puntos, ${pTexto(c2.p)}).${G.cambios.some((c) => c.p >= 0.05) ? SE_MANTIENE : ''}`,
    ],
    fuente: `Fuente: ${meta.fuente} Pregunta Z6 (variables Z6_Desiformacion).`,
    tablas: [
      {
        cabecera: ['Ronda', ...G.categorias, 'Cambio en «con frecuencia»'],
        numericas: [1, 2, 3, 4, 5],
        filas: G.rondas.map((r, i) => [
          r.label,
          ...r.dist.map((v) => `${fmt(v)} %`),
          i
            ? { v: `${fmtSigno(G.cambios[i - 1]!.dif_pp)} puntos`, sub: pTexto(G.cambios[i - 1]!.p) }
            : '—',
        ]),
        nota: `Las mismas ${fmtN(P.n)} personas en las tres rondas, sin ponderar.`,
      },
    ],
  };
}

/* ----------------------------------------------------------- 3. Populismo */

function populismo(): HallazgoVisor {
  const G = visor.populismo_indice;
  const P = G.panel;
  const c = G.cambios[0]!;
  const pct = G.rondas.map((r) => Math.round(r.pct));
  const rondas: RondaColumna[] = G.rondas.map((r) => ({
    ...r,
    tip: `${r.label} · ${r.fechas}\n${fmtN(r.n_alto)} de ${fmtN(r.n)} personas (${fmt(r.pct)} %) tienen un índice de 4 o más`,
  }));
  return {
    id: 'pop-indice',
    tema: 'populismo',
    etiqueta: 'Populismo',
    titulo: '¿Cuántos están muy de acuerdo con las ideas populistas?',
    leyenda: {
      items: [
        { texto: 'Muy de acuerdo', tipo: 'si' },
        { texto: 'El resto', tipo: 'no' },
      ],
      nota: 'Cada figura = 1 de cada 10 personas',
    },
    grafica: {
      tipo: 'pictograma',
      aria: `De cada 10 personas, cuántas están muy de acuerdo con las ideas populistas: ${G.rondas.map((r, i) => `${r.label}, ${pct[i]} %`).join('; ')}.`,
      rondas,
      entre: meta.elecciones.map((e) => `${e.label} (${fechaCorta(e.fecha)})`).join(' y '),
      cambio: cambioPts(pct[1]! - pct[0]!, c.p),
    },
    metodo: [
      `<strong>La pregunta.</strong> «En una escala de 0 a 5, donde 0 quiere decir total desacuerdo y 5 total acuerdo, qué tan de acuerdo o en desacuerdo está con las siguientes afirmaciones»:<ul>${G.items.map((t) => `<li>${t}.</li>`).join('')}</ul>`,
      '<strong>El índice.</strong> Promedio de las 8 respuestas de cada persona, de 0 a 5.',
      `<strong>Muy de acuerdo.</strong> Personas con un índice de ${G.umbral} o más.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(P.n)} personas que respondieron las 8 afirmaciones en la 1.ª y en la 3.ª ronda. La escala no se preguntó en la 2.ª ronda. No se incluye la respuesta «No lo sé».`,
      `<strong>El dato.</strong> Porcentaje sin ponderar. El cambio es la diferencia en puntos porcentuales entre las dos rondas (${fmtSigno(c.dif_pp)} puntos, ${pTexto(c.p)}).`,
    ],
    fuente: `Fuente: ${meta.fuente} Pregunta Z4 (variables Z4_Pop_1 a Z4_Pop_8).`,
    tablas: [
      {
        cabecera: ['Ronda', 'Momento', 'Muy de acuerdo', 'Porcentaje', 'Promedio del índice (0 a 5)'],
        numericas: [2, 3, 4],
        filas: G.rondas.map((r) => [
          r.label,
          r.contexto,
          `${fmtN(r.n_alto)} de ${fmtN(r.n)}`,
          `${fmt(r.pct)} %`,
          fmt(r.media, 2),
        ]),
        nota: `Cambio entre rondas: ${fmtSigno(c.dif_pp)} puntos (${pTexto(c.p)}).`,
      },
      {
        cabecera: ['De acuerdo (4 o 5) con…', ...G.rondas.map((r) => r.label)],
        numericas: [1, 2],
        filas: G.items.map((t, k) => [t, ...G.rondas.map((r) => `${fmt(r.items_acuerdo[k]!)} %`)]),
        nota: `Las mismas ${fmtN(P.n)} personas en las dos rondas, sin ponderar.`,
      },
    ],
  };
}

/* ------------------------------------------------ 4. Inteligencia artificial */

function ia(): HallazgoVisor {
  const G = visor.ia_embudo;
  const F = G.pasos;
  const Rd = G.ronda;
  return {
    id: 'ia-embudo',
    tema: 'inteligencia-artificial',
    etiqueta: 'Inteligencia artificial',
    titulo: '¿Cuántos pasan de usar la IA a confiar plenamente en ella?',
    leyenda: {
      items: [],
      nota: `De cada 100 personas · ${Rd.label} (${Rd.fechas.replace(/ de /g, ' ').replace(/junio/g, 'jun').replace(' al ', '–')}), ${Rd.contexto.toLowerCase()}`,
    },
    grafica: {
      tipo: 'embudo',
      aria: `De cada 100 personas: ${F.map((f) => `${Math.round(f.pct)} ${f.corto.replace('…', '')}`).join('; ')}.`,
      filas: [
        { texto: 'Todas las personas', pct: 100, base: true },
        ...F.map((f) => ({
          texto: f.corto,
          pct: f.pct,
          tip: `${f.corto}\n${fmtN(f.n)} de ${fmtN(G.n)} personas (${fmt(f.pct)} %)`,
        })),
      ],
    },
    metodo: [
      `<strong>Las preguntas.</strong> Escala de 0 a 5:<ul>${F.map((f) => `<li>«${f.pregunta}» (${f.escala}).</li>`).join('')}</ul>`,
      `<strong>Cada escalón.</strong> Personas que respondieron ${G.umbral} o 5 en esa pregunta y en todas las anteriores.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(G.n)} personas que respondieron las cuatro preguntas en la ${Rd.label} (${Rd.fechas}). No se incluye la respuesta «No lo sé».`,
      '<strong>El dato.</strong> Número de personas de cada 100, sin ponderar.',
    ],
    fuente: `Fuente: ${meta.fuente} Preguntas Z20 (variables Z20_IA1, Z20_IA2, Z20_IA3 y Z20_IA4).`,
    tablas: [
      {
        cabecera: [
          'Escalón',
          'Personas',
          'De cada 100',
          'Del escalón anterior',
          `${G.umbral} o 5 en esa pregunta, sin las anteriores`,
        ],
        numericas: [1, 2, 3, 4],
        filas: F.map((f, i) => [
          f.corto,
          `${fmtN(f.n)} de ${fmtN(G.n)}`,
          fmt(f.pct),
          i ? `${fmt((f.n / F[i - 1]!.n) * 100)} %` : '—',
          `${fmt(f.pct_solo)} %`,
        ]),
        nota: `${Rd.label}, sin ponderar.`,
      },
    ],
  };
}

/* ------------------------------------------------- 5. Consumo mediático */

function consumo(): HallazgoVisor {
  const G = visor.consumo_campana;
  const M = G.medios;
  const R = G.rondas;
  return {
    id: 'con-campana',
    tema: 'consumo-mediatico',
    etiqueta: 'Consumo mediático',
    titulo: '¿Por dónde siguieron la campaña?',
    leyenda: {
      items: M.map((m, i) => ({ texto: m.corto, tipo: 'serie', i })),
      nota: `% que siguió la campaña ${G.umbral} o más días por semana`,
    },
    grafica: {
      tipo: 'lineas',
      aria: `Porcentaje que siguió la campaña 5 o más días por semana: ${M.map((m) => `${m.corto} ${m.pct.map((v) => `${Math.round(v)} %`).join(', ')}`).join('; ')}.`,
      rondas: R,
      series: M.map((m) => ({ corto: m.corto, valores: m.pct })),
      max: 50,
    },
    metodo: [
      `<strong>La pregunta.</strong> «Durante esta campaña electoral, ¿con qué frecuencia está usted siguiendo las noticias en…?»<ul>${M.map((m) => `<li>${m.texto}.</li>`).join('')}</ul>Respuestas de 0 (nunca) a 7 días a la semana.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(G.n)} personas que respondieron por los cuatro medios en las tres rondas. No se incluye la respuesta «No lo sé».`,
      `<strong>El dato.</strong> Porcentaje que siguió la campaña en cada medio ${G.umbral} o más días a la semana, sin ponderar. Cada medio tiene su línea, su color y su forma de punto.`,
    ],
    fuente: `Fuente: ${meta.fuente} Preguntas D_CamInternet, D_CamTV, D_CamRadio y D_CamPaper.`,
    tablas: [
      {
        titulo: `% que siguió la campaña ${G.umbral} o más días por semana`,
        cabecera: ['Medio', ...R.map((r) => r.label), 'Cambio 1.ª → 2.ª', 'Cambio 2.ª → 3.ª'],
        numericas: [1, 2, 3, 4, 5],
        filas: M.map((m) => [
          m.corto,
          ...m.pct.map((v) => `${fmt(v)} %`),
          ...m.cambios.map((c) => ({ v: `${fmtSigno(c.dif_pp)} pts`, sub: pTexto(c.p) })),
        ]),
      },
      {
        titulo: `Promedio de días por semana (las ${fmtN(G.n)} personas)`,
        cabecera: ['Medio', ...R.map((r) => r.label)],
        numericas: [1, 2, 3],
        filas: M.map((m) => [m.corto, ...m.media.map((v) => `${fmt(v)} días`)]),
        nota: `Las mismas ${fmtN(G.n)} personas en las tres rondas, sin ponderar.`,
      },
    ],
  };
}

/* ---------------------------------------------------------- 6. Jóvenes */

function jovenes(): HallazgoVisor {
  const T = visor.jovenes.indicadores;
  const F = T.filter((t) => t.significativo);
  const V = visor.jovenes.evolucion_pol;
  const EVO =
    'Se polarizan más durante la campaña: ven con buenos ojos solo a los votantes de su candidato (1.ª → 3.ª ronda)';
  const grupos = GRUPOS_EDAD.map((g) => ({ ...g, ...V.grupos[g.k] }));
  return {
    id: 'jovenes',
    tema: 'comportamiento-juvenil',
    etiqueta: 'Comportamiento juvenil',
    titulo: '¿En qué se diferencian los jóvenes?',
    leyenda: {
      items: GRUPOS_EDAD.map((g, i) => ({ texto: g.et, tipo: 'grupo', i })),
      nota: '% en cada grupo de edad',
    },
    grafica: {
      tipo: 'mancuernas',
      aria: `Diferencias entre jóvenes de 18 a 30 años y personas de 31 o más: ${F.map((f) => `${f.titulo}, ${Math.round(f.jovenes.pct)} % frente a ${Math.round(f.mayores.pct)} %`).join('; ')}.`,
      filas: F.map((f) => ({
        titulo: f.titulo,
        jovenes: f.jovenes.pct,
        mayores: f.mayores.pct,
        tip: `${f.titulo} · ${f.ronda}\n${GRUPOS_EDAD.map((g) => `${g.et}: ${fmt(f[g.k].pct)} % (${fmtN(f[g.k].n)} personas)`).join('\n')}`,
      })),
      evolucion: V.significativo
        ? {
            titulo: EVO,
            grupos: grupos.map((g) => ({
              valores: g.pct,
              tip: `${g.et} · ven con buenos ojos solo a los votantes de su candidato\n${V.rondas.map((r, j) => `${r.label}: ${fmt(g.pct[j]!)} %`).join('\n')}`,
            })),
          }
        : undefined,
    },
    metodo: [
      '<strong>Los grupos.</strong> Jóvenes: personas de 18 a 30 años. Mayores: personas de 31 años o más. Edad declarada en la 1.ª ronda.',
      `<strong>Los indicadores.</strong> Cada uno se mide en la ronda indicada, con las personas que respondieron esa pregunta:<ul>${F.map((f) => `<li>${f.corto}: ${f.definicion} (${f.ronda}).</li>`).join('')}</ul>`,
      '<strong>Qué se muestra.</strong> Los indicadores en los que la diferencia entre los dos grupos es estadísticamente significativa (p < 0,05) al controlar por sexo y región (regresión logística).',
      ...(V.significativo
        ? [
            `<strong>La evolución.</strong> Porcentaje que ve con buenos ojos solo a los votantes de su candidato (índice WAPS hacia los votantes de 4 o más) en la 1.ª ronda (círculo vacío), la 2.ª (punto pequeño) y la 3.ª (círculo lleno), en las mismas ${fmtN(V.grupos.jovenes.n + V.grupos.mayores.n)} personas. El aumento entre la 1.ª y la 3.ª ronda es mayor en los jóvenes al controlar por sexo y región (regresión logística con medidas repetidas, ${pTexto(V.p_cambio[1]!)}).`,
          ]
        : []),
      '<strong>El dato.</strong> Porcentaje observado en cada grupo, sin ponderar.',
    ],
    fuente: `Fuente: ${meta.fuente} Edad: variable L_Age; sexo: L_Gender; región: L_Region.`,
    tablas: [
      {
        cabecera: [
          'Indicador',
          'Ronda',
          '18 a 30 años',
          '31 años o más',
          'Diferencia observada',
          'Diferencia con sexo y región',
        ],
        numericas: [2, 3, 4, 5],
        filas: F.map((t) => [
          t.corto,
          t.ronda,
          { v: `${fmt(t.jovenes.pct)} %`, sub: `${fmtN(t.jovenes.n)} personas` },
          { v: `${fmt(t.mayores.pct)} %`, sub: `${fmtN(t.mayores.n)} personas` },
          { v: `${fmtSigno(t.jovenes.pct - t.mayores.pct)} pts`, sub: pTexto(t.p) },
          { v: `${fmtSigno(t.dif_aj)} pts`, sub: pTexto(t.p_aj) },
        ]),
        nota: 'Sin ponderar. Diferencia observada: ji cuadrado. Diferencia con sexo y región: efecto marginal promedio de una regresión logística.',
      },
      ...(V.significativo
        ? [
            {
              titulo: 'Evolución: % que ve con buenos ojos solo a los votantes de su candidato',
              cabecera: ['Grupo', ...V.rondas.map((r) => r.label), 'Cambio 1.ª → 3.ª'],
              numericas: [1, 2, 3, 4],
              filas: grupos.map((g) => [
                { v: g.et, sub: `${fmtN(g.n)} personas` },
                ...g.pct.map((v) => `${fmt(v)} %`),
                `${fmtSigno(g.pct[2]! - g.pct[0]!)} pts`,
              ]),
              nota: `Diferencia en el cambio entre los dos grupos, con sexo y región: ${pTexto(V.p_cambio[1]!)} (regresión logística con medidas repetidas).`,
            },
          ]
        : []),
    ],
  };
}

/** En el orden de los temas del sitio. */
export const principales: HallazgoVisor[] = [
  polarizacion(),
  populismo(),
  desinformacion(),
  ia(),
  consumo(),
  jovenes(),
];

export const principalPorTema = (tema: string) => principales.find((h) => h.tema === tema);
