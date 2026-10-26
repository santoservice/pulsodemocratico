/**
 * Hallazgos de cada tema del visor (van en /resultados/<tema>, debajo del hallazgo principal).
 * Mismos textos, cálculos, "¿Cómo se midió?" y tablas del visor de los investigadores
 * (docs/Visor hallazgos CNEP Colombia 2026.html), en el orden de sus secciones.
 */
import {
  fechaCorta,
  fmt,
  fmtN,
  fmtSigno,
  meta,
  pTexto,
  rangoCorto,
  visor,
  type RondaVisor,
} from './comun';
import { GRUPOS_EDAD, SE_MANTIENE, WAPSV_TEXTO, principalPorTema } from './principales';
import type { HallazgoVisor, ItemDistribucion, ItemLeyenda } from './tipos';

const D = visor;
const fuente = (t: string) => `Fuente: ${meta.fuente} ${t}`;
/** "2.ª ronda (4–16 jun)". */
const rondaCorta = (Rd: RondaVisor) => `${Rd.label} (${rangoCorto(Rd.fechas)})`;
/** Leyenda de dos series de grupos de edad (color + forma). */
const leyendaEdad = (): ItemLeyenda[] => GRUPOS_EDAD.map((g, i) => ({ texto: g.et, tipo: 'serie', i }));
/** "1.ª vuelta (31 may) y 2.ª vuelta (21 jun)". */
const vueltas = meta.elecciones.map((e) => `${e.label} (${fechaCorta(e.fecha)})`).join(' y ');
/** Signo con dos decimales: +0,05 / −0,30. */
const sig2 = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmt(Math.abs(v), 2)}`;

const WAPSL_TEXTO = [
  '<strong>La pregunta.</strong> «Nos gustaría conocer sus sentimientos hacia algunas figuras políticas. En una escala de 0 a 10, ¿qué tan favorable o desfavorable es su opinión sobre los siguientes líderes políticos?» (0 = muy desfavorable, 10 = muy favorable).',
  '<strong>Los candidatos que cuentan.</strong> En la 1.ª y la 2.ª ronda: Iván Cepeda, Abelardo de la Espriella, Paloma Valencia, Sergio Fajardo, Claudia López y Roy Barreras. En la 3.ª ronda: Cepeda y De la Espriella. Las calificaciones a Gustavo Petro y Álvaro Uribe no entran en el índice.',
  '<strong>El cálculo.</strong> Para cada persona se mide cuánto se alejan sus calificaciones de su calificación promedio. Calificar igual a todos da 0; dar 10 a unos candidatos y 0 a otros se acerca a 5.',
  '<strong>Los pesos.</strong> Cada candidato pesa según su tamaño electoral (índice WAPS de Wagner, del proyecto CNEP).',
];

/* ------------------------------------------- promedio de una escala por ronda */

function mediaRondas(o: {
  id: string;
  tema: HallazgoVisor['tema'];
  etiqueta: string;
  titulo: string;
  G: typeof D.polarizacion_wapsv | typeof D.polarizacion_wapsl | typeof D.desinformacion_promedio;
  polos: [string, string];
  aria: string;
  texto: string[];
  quienes: string;
  variables: string;
  min?: number;
  max?: number;
  alto?: string;
}): HallazgoVisor {
  const { G, min = 0, max = 5, alto = 'puntúa 4 o más' } = o;
  const R = G.rondas;
  const [c1, c2] = G.cambios as [(typeof G.cambios)[number], (typeof G.cambios)[number]];
  const r2 = (v: number) => Math.round(v * 100) / 100;
  return {
    id: o.id,
    tema: o.tema,
    etiqueta: o.etiqueta,
    titulo: o.titulo,
    leyenda: { items: [] },
    grafica: {
      tipo: 'media-rondas',
      aria: `${o.aria}, de ${min} a ${max}: ${R.map((r) => `${r.label} (${r.fechas}), ${fmt(r.media)}`).join('; ')}.`,
      G,
      polos: o.polos,
      min,
      max,
      alto,
    },
    metodo: [
      ...o.texto,
      `<strong>Quiénes aparecen.</strong> ${o.quienes}`,
      `<strong>El dato.</strong> Promedio simple, sin ponderar. La franja alrededor de cada punto es el intervalo de confianza al 95 %. Las etiquetas «sube» o «baja» son el cambio promedio de esas personas entre una ronda y la siguiente (${pTexto(c1.p)} y ${pTexto(c2.p)}).`,
    ],
    fuente: fuente(o.variables),
    tablas: [
      {
        cabecera: [
          'Ronda',
          'Momento',
          `Promedio (${min} a ${max})`,
          'Intervalo de confianza al 95 %',
          alto[0]!.toUpperCase() + alto.slice(1),
          'Cambio frente a la ronda anterior',
        ],
        numericas: [2, 3, 4, 5],
        filas: R.map((r, i) => [
          r.label,
          r.contexto,
          fmt(r.media, 2),
          `${fmt(r.ic_lo, 2)} a ${fmt(r.ic_hi, 2)}`,
          `${fmt(r.pct_alto, 0)} %`,
          i
            ? { v: fmtSigno(r2(r.media) - r2(R[i - 1]!.media), 2), sub: pTexto(G.cambios[i - 1]!.p) }
            : '—',
        ]),
        nota: `Las mismas ${fmtN(G.panel.n)} personas en las tres rondas, sin ponderar. El cambio es la diferencia entre los promedios de una ronda y la siguiente.`,
      },
    ],
  };
}

/* ------------------------------------------------ distribución de una pregunta */

function distribucion(o: {
  id: string;
  tema: HallazgoVisor['tema'];
  etiqueta: string;
  titulo: string;
  it: ItemDistribucion & { var?: string; fuente?: string };
  Rd: RondaVisor;
}): HallazgoVisor {
  const { it, Rd } = o;
  const cats = it.cats ?? ['0', '1', '2', '3', '4', '5'];
  const N = cats.length;
  const [ta, tb] = (it.tramo ?? [4, 5]) as [number, number];
  const escala = it.escala ?? `de 0 (${it.polos![0]!.toLowerCase()}) a 5 (${it.polos![1]!.toLowerCase()})`;
  const nombre = (k: number) => cats[k]!.replace('|', ' ');
  const extremo = (k: number) =>
    !it.polos ? '' : k === 0 ? ` (${it.polos[0]!.toLowerCase()})` : k === N - 1 ? ` (${it.polos[1]!.toLowerCase()})` : '';
  const tramo = !it.polos
    ? `«${nombre(ta).toLowerCase()}» o «${nombre(tb).toLowerCase()}»`
    : tb === N - 1 && ta > 0 && tb - ta > 1
      ? `${nombre(ta)} o más`
      : `${nombre(ta)} o ${nombre(tb)}`;
  return {
    id: o.id,
    tema: o.tema,
    etiqueta: o.etiqueta,
    titulo: o.titulo,
    leyenda: { items: [], nota: `% de personas en cada respuesta, ${escala} · ${rondaCorta(Rd)}` },
    grafica: {
      tipo: 'distribucion',
      aria: `${it.dist.map((v, k) => `${nombre(k)}: ${fmt(v)} %`).join('; ')}.${it.media != null ? ` Promedio ${fmt(it.media, 2)}.` : ''}`,
      it,
    },
    metodo: [
      `<strong>La pregunta.</strong> «${it.pregunta}»${it.polos ? `, ${escala}` : ''}.${it.polos ? '' : ` Respuestas: ${cats.map((_, k) => nombre(k).toLowerCase()).join(', ')}.`}`,
      `<strong>${it.alto}.</strong> Personas que responden ${tramo}.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(it.n)} personas que respondieron la pregunta en la ${Rd.label} (${Rd.fechas}). No se incluye la respuesta «No lo sé».`,
      `<strong>El dato.</strong> Porcentaje en cada respuesta${it.media != null ? ' y promedio de la escala' : ''}, sin ponderar.`,
    ],
    fuente: fuente(`${it.fuente ?? `Pregunta Z20 (variable ${it.var})`}.`),
    tablas: [
      {
        cabecera: ['Respuesta', 'Personas (%)'],
        numericas: [1],
        filas: [
          ...it.dist.map((v, k) => [`${nombre(k)}${extremo(k)}`, `${fmt(v)} %`]),
          [`${it.alto} (${tramo})`, `${fmt(it.pct_alto)} %`],
          ...(it.media != null ? [['Promedio', fmt(it.media, 2)]] : []),
        ],
        nota: `${fmtN(it.n)} personas, ${Rd.label}, sin ponderar.`,
      },
    ],
  };
}

/* ------------------------------------------------------- titulares (1 a 5) */

function titulares(o: {
  id: string;
  titulo: string;
  C: typeof D.desinformacion_titulares | typeof D.desinformacion_compartir;
  origen: number;
  medio: string;
  polos: [string, string];
  medida: string;
  escala: string;
  pregunta: string;
  alto: string;
  bajo: string;
  calculo: string;
  variables: string;
}): HallazgoVisor {
  const { C } = o;
  const Rd = C.ronda;
  const F = C.tipos.falsos;
  const V = C.tipos.verdaderos;
  const S = [
    { k: 'falsos', et: 'Titulares falsos' },
    { k: 'verdaderos', et: 'Titulares verdaderos' },
  ] as const;
  return {
    id: o.id,
    tema: 'desinformacion',
    etiqueta: 'Desinformación',
    titulo: o.titulo,
    leyenda: { items: [], nota: `${o.medida} de cada titular, ${o.escala} · ${rondaCorta(Rd)}` },
    grafica: {
      tipo: 'titulares',
      aria: `${o.medida}: titulares falsos ${fmt(F.media, 2)}, titulares verdaderos ${fmt(V.media, 2)}, en una escala de 1 a 5.`,
      C,
      origen: o.origen,
      medio: o.medio,
      polos: o.polos,
      medida: o.medida,
      alto: o.alto,
      bajo: o.bajo,
    },
    metodo: [
      `<strong>La pregunta.</strong> ${o.pregunta}, ${o.escala}, para ocho titulares.<ul><li>Falsos: ${F.titulares.map((t) => `«${t.texto}»`).join('; ')}.</li><li>Verdaderos: ${V.titulares.map((t) => `«${t.texto}»`).join('; ')}.</li></ul>`,
      `<strong>El cálculo.</strong> ${o.calculo}`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(C.n)} personas que respondieron los ocho titulares en la ${Rd.label} (${Rd.fechas}). No se incluye la respuesta «No lo sé».`,
      `<strong>El dato.</strong> Promedios sin ponderar. Diferencia entre verdaderos y falsos: ${fmt(V.media - F.media, 2)} puntos (prueba t pareada, ${pTexto(C.p)}).`,
    ],
    fuente: fuente(`Preguntas Z10 (${o.variables}).`),
    tablas: S.map((s) => ({
      titulo: `${s.et} · promedio ${fmt(C.tipos[s.k].media, 2)}`,
      cabecera: ['Titular', 'Promedio', o.alto, o.bajo],
      numericas: [1, 2, 3],
      filas: C.tipos[s.k].titulares.map((t) => [t.corto, fmt(t.media, 2), `${fmt(t.pct_alto)} %`, `${fmt(t.pct_bajo)} %`]),
      nota: s.k === 'verdaderos' ? `${fmtN(C.n)} personas, ${Rd.label}, sin ponderar. Escala ${o.escala}.` : undefined,
    })),
  };
}

/* ============================================================ POLARIZACIÓN */

function polExtremos(): HallazgoVisor {
  const G = D.polarizacion_extremos;
  const R = G.rondas;
  const T = G.tramos;
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const dm = (i: number) => r2(R[i]!.media) - r2(R[i - 1]!.media);
  return {
    id: 'pex',
    tema: 'polarizacion',
    etiqueta: 'Polarización ideológica',
    titulo: '¿Cuántos se alejan mucho del centro ideológico?',
    leyenda: {
      items: [],
      nota: 'Cada punto = 1 % de las personas, ubicado según su distancia al centro de la escala izquierda-derecha (índice IE). Más intenso = más lejos del centro.',
    },
    grafica: {
      tipo: 'puntos-ie',
      aria: `Distancia al centro ideológico (índice IE) por ronda: ${R.map((r) => `${r.label}, promedio ${fmt(r.media, 2)}, ${Math.round(r.pct_lejos)} % a 4 o más`).join('; ')}.`,
      G,
    },
    metodo: [
      '<strong>La pregunta.</strong> «Mucha gente, cuando piensa en política, usa los términos de "izquierda" y "derecha". ¿Usted por lo general dónde ubicaría sus puntos de vista políticos en esta escala?» (0 = izquierda, 10 = derecha).',
      `<strong>El índice.</strong> Extremismo ideológico (IE) del proyecto CNEP: distancia entre la ubicación de cada persona y la ubicación promedio de todas las personas de esa ronda. Va de 0 (en el promedio) a ${fmt(G.maximo)} (en un extremo de la escala).`,
      `<strong>Los tramos.</strong> Distancia al centro: ${T.join('; ')}. «4 o más» corresponde a quienes se ubican en los extremos de la escala.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(G.n)} personas que tienen el índice en las tres rondas.`,
      '<strong>El gráfico.</strong> Cada punto es el 1 % de esas personas, ubicado en su valor del índice. La línea vertical es el promedio y la zona sombreada, los valores de 4 o más. Sin ponderar.',
      `<strong>El cambio.</strong> Cambio promedio del índice en esas mismas personas frente a la ronda anterior (${fmtSigno(dm(1), 2)}, ${pTexto(G.cambios_media[0]!.p)}; ${fmtSigno(dm(2), 2)}, ${pTexto(G.cambios_media[1]!.p)}).${G.cambios_media.some((c) => c.p >= 0.05) ? SE_MANTIENE : ''}`,
    ],
    fuente: fuente('Índice IE (variables IE).'),
    tablas: [
      {
        titulo: '% en cada tramo del índice',
        cabecera: ['Distancia al centro', ...R.map((r) => r.label)],
        numericas: [1, 2, 3],
        filas: T.map((t, j) => [
          t,
          ...R.map((r, i) =>
            j === T.length - 1 && i
              ? { v: `${fmt(r.tramos[j]!)} %`, sub: `${fmtSigno(G.cambios[i - 1]!.dif_pp)} pts, ${pTexto(G.cambios[i - 1]!.p)}` }
              : `${fmt(r.tramos[j]!)} %`,
          ),
        ]),
      },
      {
        titulo: 'Promedio del índice',
        cabecera: ['', ...R.map((r) => r.label)],
        numericas: [1, 2, 3],
        filas: [
          [
            'Extremismo ideológico (IE)',
            ...R.map((r, i) =>
              i ? { v: fmt(r.media, 2), sub: `${fmtSigno(dm(i), 2)}, ${pTexto(G.cambios_media[i - 1]!.p)}` } : fmt(r.media, 2),
            ),
          ],
        ],
        nota: `Las mismas ${fmtN(G.n)} personas en las tres rondas, sin ponderar.`,
      },
    ],
  };
}

function polSankey(): HallazgoVisor {
  const G = D.polarizacion_wpip;
  const R = G.rondas;
  const N = G.niveles;
  const F = G.flujos;
  const tramo = (n: (typeof N)[number]) =>
    n.hasta > 50 ? `${fmt(n.desde)} o más` : n.desde === 0 ? `menos de ${fmt(n.hasta)}` : `${fmt(n.desde)} a menos de ${fmt(n.hasta)}`;
  const BG = ['bg-seq-2', 'bg-seq-4', 'bg-seq-6'];
  return {
    id: 'wsk',
    tema: 'polarizacion',
    etiqueta: 'Polarización percibida',
    titulo: '¿Qué tan lejos ven a los partidos entre sí?',
    leyenda: {
      items: N.map((n, i) => ({ texto: `${n.nombre} (${tramo(n)})`, tipo: 'color', bg: BG[i] })),
      nota: `${R.map((r) => `${r.label}: ${r.partidos.join(' y ')}`).join(' · ')}. Entre ambas: ${vueltas}.`,
    },
    grafica: {
      tipo: 'sankey',
      aria: 'Flujos de las mismas personas entre niveles de polarización percibida, de la 1.ª a la 3.ª ronda.',
      G,
    },
    metodo: [
      '<strong>La pregunta.</strong> «Ahora podría ubicar a los partidos políticos en la misma escala de izquierda a derecha» (0 = izquierda, 10 = derecha).',
      `<strong>El índice.</strong> Polarización ideológica percibida (WPIP) del proyecto CNEP: distancia entre las ubicaciones que cada persona da a dos partidos, ponderada por su tamaño electoral; va de 0 (los ve en el mismo punto) a 5 (los ve en los extremos opuestos). ${R.map((r) => `${r.label}: ${r.partidos.join(' y ')}`).join('. ')}. No se preguntó en la 2.ª ronda.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(G.n)} personas que ubicaron a los dos partidos en la 1.ª y en la 3.ª ronda.`,
      `<strong>Los niveles.</strong> ${N.map((n) => `${n.nombre}: ${tramo(n)}`).join('; ')}. Las bandas muestran cuántas personas pasan de un nivel en la 1.ª ronda a otro en la 3.ª; su color es el del nivel de partida.`,
      `<strong>El dato.</strong> Porcentaje sin ponderar. Promedio del índice: ${fmt(R[0]!.media, 2)} y ${fmt(R[1]!.media, 2)} (${pTexto(G.cambio_media.p)}); «muy lejos»: ${fmt(R[0]!.niveles[2]!, 0)} % y ${fmt(R[1]!.niveles[2]!, 0)} % (${pTexto(G.cambio_lejos.p)}).`,
    ],
    fuente: fuente('Índice WPIP (variables WPIP_1 y WPIP_2).'),
    tablas: [
      {
        titulo: '% en cada nivel',
        cabecera: ['Nivel', ...R.map((r) => r.label)],
        numericas: [1, 2],
        filas: [
          ...N.map((n, i) => [`${n.nombre} (${tramo(n)})`, ...R.map((r) => `${fmt(r.niveles[i]!)} %`)]),
          ['Promedio del índice (0 a 5)', ...R.map((r) => fmt(r.media, 2))],
        ],
      },
      {
        titulo: `De la 1.ª a la 3.ª ronda (% de las ${fmtN(G.n)} personas)`,
        cabecera: ['1.ª ronda ↓ · 3.ª ronda →', ...N.map((n) => n.nombre)],
        numericas: [1, 2, 3],
        filas: N.map((n, i) => [n.nombre, ...F[i]!.map((v) => `${fmt((v / G.n) * 100)} %`)]),
        nota: `Las mismas ${fmtN(G.n)} personas en las dos rondas, sin ponderar.`,
      },
    ],
  };
}

/* ================================================================ JÓVENES */

function jovPolarizacion(): HallazgoVisor {
  const V = D.jovenes.evolucion_pol;
  const R = V.rondas;
  const P = D.polarizacion_alto.panel;
  const series = GRUPOS_EDAD.map((g) => ({ corto: g.et, ...V.grupos[g.k] }));
  return {
    id: 'jpo',
    tema: 'comportamiento-juvenil',
    etiqueta: 'Jóvenes · Polarización',
    titulo: '¿Los jóvenes se polarizaron más durante la campaña?',
    leyenda: {
      items: leyendaEdad(),
      nota: '% que ve con buenos ojos solo a los votantes de su candidato. A la derecha, el cambio total en puntos desde la 1.ª ronda',
    },
    grafica: {
      tipo: 'lineas',
      aria: `Porcentaje que ve con buenos ojos solo a los votantes de su candidato, por edad: ${series.map((s) => `${s.corto} ${s.pct.map((v) => `${Math.round(v)} %`).join(', ')}`).join('; ')}.`,
      rondas: R,
      series: series.map((s) => ({ corto: s.corto, valores: s.pct })),
      max: 60,
      detalle: true,
    },
    metodo: [
      ...WAPSV_TEXTO,
      '<strong>Solo a los suyos.</strong> Personas con 4 o más en esa escala de 0 a 5.',
      `<strong>Los grupos.</strong> 18 a 30 años (${fmtN(V.grupos.jovenes.n)} personas) y 31 años o más (${fmtN(V.grupos.mayores.n)} personas). Edad declarada en la 1.ª ronda.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(P.n)} personas que tienen el índice en las tres rondas. En la 3.ª ronda se incluye a quienes calificaron a los dos grupos de votantes.`,
      '<strong>El dato.</strong> Porcentaje en cada grupo y ronda, sin ponderar.',
      `<strong>La comparación del cambio.</strong> Regresión logística con medidas repetidas (GEE), controlando por sexo y región: el aumento entre la 1.ª y la 3.ª ronda es mayor en los jóvenes (${pTexto(V.p_cambio[1]!)}); entre la 1.ª y la 2.ª, ${pTexto(V.p_cambio[0]!)}.`,
    ],
    fuente: fuente('Índice WAPS hacia los votantes (variables WAPSV); edad: L_Age; sexo: L_Gender; región: L_Region.'),
    tablas: [
      {
        titulo: '% que ve con buenos ojos solo a los votantes de su candidato',
        cabecera: ['Grupo', ...R.map((r) => r.label), 'Cambio 1.ª → 3.ª'],
        numericas: [1, 2, 3, 4],
        filas: [
          ...series.map((s) => [
            { v: s.corto, sub: `${fmtN(s.n)} personas` },
            ...s.pct.map((v) => `${fmt(v)} %`),
            `${fmtSigno(s.pct[2]! - s.pct[0]!)} pts`,
          ]),
          [
            { v: 'Diferencia con sexo y región', sub: '18 a 30 menos 31 o más' },
            ...V.dif_aj.map((d) => ({ v: `${fmtSigno(d.dif)} pts`, sub: pTexto(d.p) })),
            pTexto(V.p_cambio[1]!),
          ],
        ],
      },
      {
        titulo: 'Promedio del índice (0 a 5)',
        cabecera: ['Grupo', ...R.map((r) => r.label)],
        numericas: [1, 2, 3],
        filas: series.map((s) => [s.corto, ...s.media.map((v) => fmt(v, 2))]),
        nota: `Las mismas ${fmtN(P.n)} personas en las tres rondas, sin ponderar.`,
      },
    ],
  };
}

function jovCepeda(): HallazgoVisor {
  const C = D.jovenes_cepeda;
  const R = C.rondas;
  const series = GRUPOS_EDAD.map((g) => ({ corto: g.et, ...C.grupos[g.k] }));
  const pc = (g: 'jovenes' | 'mayores') => C.grupos[g].cambios;
  return {
    id: 'jce',
    tema: 'comportamiento-juvenil',
    etiqueta: 'Jóvenes · Candidatos',
    titulo: '¿A quién prefieren los jóvenes: Cepeda o De la Espriella?',
    leyenda: {
      items: leyendaEdad(),
      nota: 'Calificación a Cepeda menos calificación a De la Espriella, promedio (de −10 a +10). A la derecha, el cambio desde la 1.ª ronda',
    },
    grafica: {
      tipo: 'lineas',
      aria: `Calificación a Cepeda menos calificación a De la Espriella, por edad: ${series.map((s) => `${s.corto} ${s.pct.map((v) => sig2(v)).join(', ')}`).join('; ')}.`,
      rondas: R,
      series: series.map((s) => ({ corto: s.corto, valores: s.pct })),
      min: -4,
      max: 4,
      paso: 2,
      dec: 1,
      unidad: '',
      signo: true,
      detalle: true,
      polos: ['Más a Cepeda', 'Más a De la Espriella'],
    },
    metodo: [
      '<strong>La pregunta.</strong> «Nos gustaría conocer sus sentimientos hacia algunas figuras políticas. En una escala de 0 a 10, ¿qué tan favorable o desfavorable es su opinión sobre los siguientes líderes políticos?» (0 = muy desfavorable, 10 = muy favorable), para Iván Cepeda y Abelardo de la Espriella.',
      '<strong>El índice.</strong> Para cada persona, su calificación a Cepeda menos su calificación a De la Espriella. Va de −10 a +10: positivo = prefiere a Cepeda; negativo = prefiere a De la Espriella; 0 = los califica igual.',
      `<strong>Los grupos.</strong> 18 a 30 años (${fmtN(C.grupos.jovenes.n)} personas) y 31 años o más (${fmtN(C.grupos.mayores.n)} personas). Edad declarada en la 1.ª ronda.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(C.n)} personas que calificaron a los dos candidatos en las tres rondas.`,
      `<strong>El dato.</strong> Promedio del índice en cada grupo y ronda, sin ponderar. Cambio entre la 1.ª y la 3.ª ronda: 18 a 30 años, ${sig2(pc('jovenes')[2]!.dif)} (${pTexto(pc('jovenes')[2]!.p)}); 31 años o más, ${sig2(pc('mayores')[2]!.dif)} (${pTexto(pc('mayores')[2]!.p)}).`,
      `<strong>La diferencia entre grupos.</strong> Controlando por sexo y región (regresión lineal): ${C.dif_aj.map((d, i) => `${R[i]!.label}, ${sig2(d.dif)} (${pTexto(d.p)})`).join('; ')}.`,
    ],
    fuente: fuente('Variables C_ThermGov2Leader y C_ThermOpp2Leader; edad: L_Age; sexo: L_Gender; región: L_Region.'),
    tablas: [
      {
        titulo: 'Índice Cepeda menos De la Espriella (promedio)',
        cabecera: ['Grupo', ...R.map((r) => r.label), 'Cambio 1.ª → 3.ª'],
        numericas: [1, 2, 3, 4],
        filas: [
          ...series.map((s) => [
            { v: s.corto, sub: `${fmtN(s.n)} personas` },
            ...s.pct.map((x) => sig2(x)),
            { v: sig2(s.cambios[2]!.dif), sub: pTexto(s.cambios[2]!.p) },
          ]),
          [
            { v: 'Diferencia con sexo y región', sub: '18 a 30 menos 31 o más' },
            ...C.dif_aj.map((d) => ({ v: sig2(d.dif), sub: pTexto(d.p) })),
            '',
          ],
        ],
      },
      {
        titulo: 'Calificación promedio a cada candidato (0 a 10)',
        cabecera: ['Grupo', ...R.map((r) => r.label)],
        numericas: [1, 2, 3],
        filas: series.map((s) => [
          s.corto,
          ...R.map((_, i) => ({ v: `Cepeda ${fmt(s.cepeda[i]!, 2)}`, sub: `De la Espriella ${fmt(s.espriella[i]!, 2)}` })),
        ]),
      },
      {
        titulo: '% que prefiere a cada candidato',
        cabecera: ['Grupo', ...R.map((r) => r.label)],
        numericas: [1, 2, 3],
        filas: series.map((s) => [
          s.corto,
          ...s.reparto.map((x) => ({
            v: `Cepeda ${fmt(x[0]!, 0)} %`,
            sub: `igual ${fmt(x[1]!, 0)} % · De la Espriella ${fmt(x[2]!, 0)} %`,
          })),
        ]),
        nota: `Las mismas ${fmtN(C.n)} personas en las tres rondas, sin ponderar.`,
      },
    ],
  };
}

function jovCredibilidad(): HallazgoVisor {
  const C = D.jovenes_credibilidad;
  const T = C.tramos;
  const Rd = C.ronda;
  const P = C.pruebas;
  const claves = ['verdaderos', 'falsos', 'distingue'] as const;
  return {
    id: 'jcr',
    tema: 'comportamiento-juvenil',
    etiqueta: 'Jóvenes · Desinformación',
    titulo: '¿Distinguen los jóvenes las noticias falsas de las verdaderas?',
    leyenda: {
      items: [
        { texto: 'Titulares verdaderos', tipo: 'serie', i: 0 },
        { texto: 'Titulares falsos', tipo: 'serie', i: 1 },
      ],
      nota: `Credibilidad promedio que le dan, de 1 (definitivamente falsa) a 5 (definitivamente verdadera) · ${rondaCorta(Rd)}`,
    },
    grafica: {
      tipo: 'credibilidad',
      aria: `Credibilidad promedio de titulares verdaderos y falsos por edad: ${T.map((t) => `${t.nombre}, verdaderos ${fmt(t.verdaderos, 2)}, falsos ${fmt(t.falsos, 2)}`).join('; ')}.`,
      C,
    },
    metodo: [
      `<strong>La pregunta.</strong> «¿Qué tan cierta considera usted esta información?», de 1 (definitivamente falsa) a 5 (definitivamente verdadera), para ocho titulares.<ul><li>Falsos: ${C.titulares.falsos.map((t) => `«${t}»`).join('; ')}.</li><li>Verdaderos: ${C.titulares.verdaderos.map((t) => `«${t}»`).join('; ')}.</li></ul>`,
      '<strong>El cálculo.</strong> Para cada persona, el promedio de su calificación a los cuatro titulares falsos y el de los cuatro verdaderos. La distancia es el promedio de los verdaderos menos el de los falsos: cuanto mayor, mejor distingue unos de otros.',
      `<strong>Los grupos.</strong> Edad declarada en la 1.ª ronda: ${T.map((t) => `${t.nombre} (${fmtN(t.n)} personas)`).join(', ')}.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(C.n)} personas que calificaron los ocho titulares en la ${Rd.label} (${Rd.fechas}). No se incluye la respuesta «No lo sé».`,
      `<strong>El dato.</strong> Promedio en cada grupo, sin ponderar. Diferencias por edad controlando por sexo y región (regresión lineal): titulares falsos, ${pTexto(P.falsos.p_edad)}; verdaderos, ${pTexto(P.verdaderos.p_edad)}; distancia, ${pTexto(P.distingue.p_edad)}.`,
    ],
    fuente: fuente('Preguntas Z10 (variables Z10_FakeNews1a a 4a y Z10_TrueNews1a a 4a).'),
    tablas: [
      {
        cabecera: ['Edad', 'Personas', 'Titulares verdaderos', 'Titulares falsos', 'Distancia'],
        numericas: [1, 2, 3, 4],
        filas: [
          ...T.map((t) => [t.nombre, fmtN(t.n), fmt(t.verdaderos, 2), fmt(t.falsos, 2), fmt(t.distingue, 2)]),
          [{ v: 'Diferencia por edad', sub: 'con sexo y región' }, '', ...claves.map((k) => pTexto(P[k].p_edad))],
          [
            { v: '18 a 30 menos 31 o más', sub: 'con sexo y región' },
            '',
            ...claves.map((k) => ({ v: sig2(P[k].dif_jovenes), sub: pTexto(P[k].p_jovenes) })),
          ],
        ],
        nota: `${Rd.label}, sin ponderar. Escala de 1 (definitivamente falsa) a 5 (definitivamente verdadera).`,
      },
    ],
  };
}

function jovPopulismo(): HallazgoVisor {
  const C = D.jovenes_populismo;
  const R = C.rondas;
  const PP = D.populismo_indice;
  const Gj = C.grupos.jovenes;
  const Gm = C.grupos.mayores;
  return {
    id: 'jpp',
    tema: 'comportamiento-juvenil',
    etiqueta: 'Jóvenes · Populismo',
    titulo: '¿Cambió el apoyo a las ideas populistas entre jóvenes y mayores?',
    leyenda: {
      items: leyendaEdad(),
      nota: `% muy de acuerdo con las ideas populistas (índice de ${C.umbral} o más). Entre ambas rondas: ${vueltas}`,
    },
    grafica: {
      tipo: 'pendiente',
      aria: `Porcentaje muy de acuerdo con las ideas populistas por edad: ${GRUPOS_EDAD.map((g) => `${g.et} ${Math.round(C.grupos[g.k].pct[0]!)} % y ${Math.round(C.grupos[g.k].pct[1]!)} %`).join('; ')}.`,
      C,
    },
    metodo: [
      `<strong>La pregunta.</strong> «En una escala de 0 a 5, donde 0 quiere decir total desacuerdo y 5 total acuerdo, qué tan de acuerdo o en desacuerdo está con las siguientes afirmaciones»:<ul>${PP.items.map((t) => `<li>${t}.</li>`).join('')}</ul>`,
      `<strong>El índice.</strong> Promedio de las 8 respuestas de cada persona, de 0 a 5. «Muy de acuerdo»: índice de ${C.umbral} o más.`,
      `<strong>Los grupos.</strong> 18 a 30 años (${fmtN(Gj.n)} personas) y 31 años o más (${fmtN(Gm.n)} personas). Edad declarada en la 1.ª ronda.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(C.n)} personas que respondieron las 8 afirmaciones en la 1.ª y en la 3.ª ronda. La escala no se preguntó en la 2.ª ronda.`,
      `<strong>El dato.</strong> Porcentaje en cada grupo, sin ponderar. Cambio entre rondas: 18 a 30 años, ${fmtSigno(Gj.cambio.dif_pp)} puntos (${pTexto(Gj.cambio.p)}); 31 años o más, ${fmtSigno(Gm.cambio.dif_pp)} puntos (${pTexto(Gm.cambio.p)}). «Se mantiene» indica un cambio que no es estadísticamente significativo.`,
      `<strong>La comparación entre grupos.</strong> Controlando por sexo y región: diferencia de ${fmtSigno(C.dif_aj[0]!.dif)} puntos en la 1.ª ronda (${pTexto(C.dif_aj[0]!.p)}) y de ${fmtSigno(C.dif_aj[1]!.dif)} en la 3.ª (${pTexto(C.dif_aj[1]!.p)}). La diferencia en el cambio entre grupos: ${pTexto(C.p_cambio)} (regresión logística con medidas repetidas).`,
    ],
    fuente: fuente('Pregunta Z4 (variables Z4_Pop_1 a Z4_Pop_8); edad: L_Age; sexo: L_Gender; región: L_Region.'),
    tablas: [
      {
        titulo: '% muy de acuerdo con las ideas populistas',
        cabecera: ['Grupo', ...R.map((r) => r.label), 'Cambio'],
        numericas: [1, 2, 3],
        filas: [
          ...GRUPOS_EDAD.map((g) => {
            const v = C.grupos[g.k];
            return [
              { v: g.et, sub: `${fmtN(v.n)} personas` },
              ...v.pct.map((x) => `${fmt(x)} %`),
              { v: `${fmtSigno(v.cambio.dif_pp)} pts`, sub: pTexto(v.cambio.p) },
            ];
          }),
          [
            { v: 'Diferencia con sexo y región', sub: '18 a 30 menos 31 o más' },
            ...C.dif_aj.map((d) => ({ v: `${fmtSigno(d.dif)} pts`, sub: pTexto(d.p) })),
            pTexto(C.p_cambio),
          ],
        ],
      },
      {
        titulo: 'Promedio del índice (0 a 5)',
        cabecera: ['Grupo', ...R.map((r) => r.label)],
        numericas: [1, 2],
        filas: GRUPOS_EDAD.map((g) => [g.et, ...C.grupos[g.k].media.map((x) => fmt(x, 2))]),
        nota: `Las mismas ${fmtN(C.n)} personas en las dos rondas, sin ponderar.`,
      },
    ],
  };
}

function jovIA(): HallazgoVisor {
  const C = D.jovenes_ia;
  const Rd = C.ronda;
  const base = D.ia_embudo;
  const sig = (d: { dif: number; p: number }) => `${fmtSigno(d.dif)} pts (${pTexto(d.p)})`;
  return {
    id: 'jia',
    tema: 'comportamiento-juvenil',
    etiqueta: 'Jóvenes · Inteligencia artificial',
    titulo: '¿Los jóvenes usan y confían más en la IA para votar?',
    leyenda: {
      items: GRUPOS_EDAD.map((g, i) => ({ texto: g.et, tipo: 'color', bg: i ? 'bg-serie-2' : 'bg-serie-1' })),
      nota: `De cada 100 personas de cada grupo · ${rondaCorta(Rd)}. Cada escalón incluye solo a quienes pasaron los anteriores.`,
    },
    grafica: {
      tipo: 'embudo-doble',
      aria: `Embudo de uso y confianza en la IA por edad: ${C.pasos.map((p, i) => `${p.replace('…', '')}: ${Math.round(C.grupos.jovenes.pasos[i]!.pct)} de cada 100 jóvenes y ${Math.round(C.grupos.mayores.pasos[i]!.pct)} de cada 100 mayores`).join('; ')}.`,
      C,
    },
    metodo: [
      `<strong>Las preguntas.</strong> Escala de 0 a 5:<ul>${base.pasos.map((f) => `<li>«${f.pregunta}» (${f.escala}).</li>`).join('')}</ul>`,
      '<strong>Cada escalón.</strong> Personas que respondieron 4 o 5 en esa pregunta y en todas las anteriores.',
      `<strong>Los grupos.</strong> 18 a 30 años (${fmtN(C.grupos.jovenes.n)} personas) y 31 años o más (${fmtN(C.grupos.mayores.n)} personas). Edad declarada en la 1.ª ronda.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(C.n)} personas que respondieron las cuatro preguntas en la ${Rd.label} (${Rd.fechas}). No se incluye la respuesta «No lo sé».`,
      `<strong>El dato.</strong> Número de personas de cada 100 en cada grupo, sin ponderar. Diferencia entre 18 a 30 años y 31 o más en cada escalón, controlando por sexo y región (regresión logística): ${C.pasos.map((p, i) => `${p.replace('…', '')}, ${sig(C.dif_aj[i]!)}`).join('; ')}.`,
    ],
    fuente: fuente('Preguntas Z20 (variables Z20_IA1, Z20_IA2, Z20_IA3 y Z20_IA4); edad: L_Age; sexo: L_Gender; región: L_Region.'),
    tablas: [
      {
        cabecera: ['Escalón', ...GRUPOS_EDAD.map((g) => g.et), 'Diferencia con sexo y región'],
        numericas: [1, 2, 3],
        filas: C.pasos.map((p, i) => [
          p,
          ...GRUPOS_EDAD.map((g) => {
            const x = C.grupos[g.k].pasos[i]!;
            return { v: fmt(x.pct), sub: `${fmtN(x.n)} de ${fmtN(C.grupos[g.k].n)}` };
          }),
          { v: `${fmtSigno(C.dif_aj[i]!.dif)} pts`, sub: pTexto(C.dif_aj[i]!.p) },
        ]),
        nota: `De cada 100 personas de cada grupo, ${Rd.label}, sin ponderar.`,
      },
    ],
  };
}

function jovMedios(): HallazgoVisor {
  const C = D.jovenes_medios;
  const T = C.tramos;
  const M = C.medios;
  const R = C.rondas;
  return {
    id: 'jme',
    tema: 'comportamiento-juvenil',
    etiqueta: 'Jóvenes · Consumo de medios',
    titulo: '¿Por dónde siguieron la campaña según la edad?',
    leyenda: {
      items: T.map((t, i) => ({ texto: t.nombre, tipo: 'edad', i })),
      nota: 'Días por semana que siguió la campaña en cada medio (promedio, de 0 a 7)',
    },
    grafica: { tipo: 'mini-lineas', aria: 'Días por semana que siguieron la campaña por medio y franja de edad.', C },
    metodo: [
      `<strong>La pregunta.</strong> «Durante esta campaña electoral, ¿con qué frecuencia está usted siguiendo las noticias en…?»<ul>${M.map((m) => `<li>${m.texto}.</li>`).join('')}</ul>Respuestas de 0 (nunca) a 7 días a la semana.`,
      `<strong>Los grupos.</strong> Edad declarada en la 1.ª ronda: ${T.map((t) => `${t.nombre} (${fmtN(t.n)} personas)`).join(', ')}.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(C.n)} personas que respondieron por los cuatro medios en las tres rondas. No se incluye la respuesta «No lo sé».`,
      '<strong>El dato.</strong> Promedio de días por semana en cada franja y ronda, sin ponderar. Cada mini gráfico es un medio, con la misma escala de 0 a 5 días. A la derecha, el valor de la 3.ª ronda de la franja más joven y de la mayor.',
      `<strong>La diferencia por edad.</strong> Controlando por sexo y región (regresión lineal), en cada ronda: ${M.map((md) => `${md.corto}, ${md.p_edad.map(pTexto).join(' / ')}`).join('; ')}.`,
    ],
    fuente: fuente('Preguntas D_CamInternet, D_CamTV, D_CamRadio y D_CamPaper; edad: L_Age; sexo: L_Gender; región: L_Region.'),
    tablas: M.map((md, k) => ({
      titulo: `${md.corto}: días por semana (promedio)`,
      cabecera: ['Edad', ...R.map((r) => r.label)],
      numericas: [1, 2, 3],
      filas: [
        ...T.map((t, i) => [t.nombre, ...md.grupos[i]!.media.map((v) => fmt(v, 2))]),
        [{ v: 'Diferencia por edad', sub: 'con sexo y región' }, ...md.p_edad.map((p) => pTexto(p))],
      ],
      nota: k === M.length - 1 ? `Las mismas ${fmtN(C.n)} personas en las tres rondas, sin ponderar.` : undefined,
    })),
  };
}

function jovComparte(): HallazgoVisor {
  const C = D.jovenes_comparte;
  const K = C.categorias;
  const Rd = C.ronda;
  const BG = ['bg-seq-1', 'bg-seq-3', 'bg-seq-4', 'bg-seq-6'];
  const sig = (d: { dif: number; p: number }) => `${fmtSigno(d.dif)} pts (${pTexto(d.p)})`;
  return {
    id: 'jco',
    tema: 'comportamiento-juvenil',
    etiqueta: 'Jóvenes · Redes',
    titulo: '¿Los jóvenes comparten más sus opiniones políticas en plataformas digitales?',
    leyenda: {
      items: K.map((k, i) => ({ texto: k, tipo: 'color', bg: BG[i] })),
      nota: `% de personas en cada grupo · ${rondaCorta(Rd)}`,
    },
    grafica: {
      tipo: 'apiladas-edad',
      aria: `Con qué frecuencia comparten sus opiniones políticas en plataformas digitales: ${GRUPOS_EDAD.map((g) => `${g.et}, ${Math.round(C.grupos[g.k].pct_frecuente)} % con frecuencia`).join('; ')}.`,
      C,
    },
    metodo: [
      `<strong>La pregunta.</strong> «¿Con qué frecuencia usted comparte sus opiniones políticas en plataformas digitales?». Respuestas: ${K.map((k) => k.toLowerCase()).join(', ')}.`,
      '<strong>Con frecuencia.</strong> Personas que responden «la mayoría de las veces» o «siempre».',
      `<strong>Los grupos.</strong> 18 a 30 años (${fmtN(C.grupos.jovenes.n)} personas) y 31 años o más (${fmtN(C.grupos.mayores.n)} personas). Edad declarada en la 1.ª ronda.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(C.n)} personas que respondieron la pregunta en la ${Rd.label} (${Rd.fechas}). No se incluye la respuesta «No lo sé».`,
      `<strong>El dato.</strong> Porcentaje en cada grupo, sin ponderar. Diferencia entre 18 a 30 años y 31 o más, controlando por sexo y región (regresión logística): con frecuencia, ${sig(C.dif_frecuente)}; a veces o más, ${sig(C.dif_algo)}.`,
    ],
    fuente: fuente('Pregunta Z25 (variable Z25_Contenodio4); edad: L_Age; sexo: L_Gender; región: L_Region.'),
    tablas: [
      {
        cabecera: ['Respuesta', ...GRUPOS_EDAD.map((g) => g.et)],
        numericas: [1, 2],
        filas: [
          ...K.map((k, j) => [k, ...GRUPOS_EDAD.map((g) => `${fmt(C.grupos[g.k].dist[j]!)} %`)]),
          ['Con frecuencia (la mayoría de las veces o siempre)', ...GRUPOS_EDAD.map((g) => `${fmt(C.grupos[g.k].pct_frecuente)} %`)],
          ['A veces o más', ...GRUPOS_EDAD.map((g) => `${fmt(C.grupos[g.k].pct_algo)} %`)],
          ['Personas', ...GRUPOS_EDAD.map((g) => fmtN(C.grupos[g.k].n))],
        ],
        nota: `Diferencia con sexo y región (18 a 30 menos 31 o más): con frecuencia, ${sig(C.dif_frecuente)}; a veces o más, ${sig(C.dif_algo)}. ${Rd.label}, sin ponderar.`,
      },
    ],
  };
}

/* ========================================================== DESINFORMACIÓN */

function desIA(): HallazgoVisor {
  const C = D.desinformacion_ia;
  const I = C.items;
  const Rd = C.ronda;
  const Gs = [
    { k: 'creen', et: 'Les creen', det: 'más de 3' },
    { k: 'no_creen', et: 'No les creen', det: '3 o menos' },
  ] as const;
  const T = D.desinformacion_titulares.tipos.falsos.titulares;
  return {
    id: 'dia',
    tema: 'desinformacion',
    etiqueta: 'Desinformación · Inteligencia artificial',
    titulo: '¿Confunden más los mensajes de IA quienes les creen a las noticias falsas?',
    leyenda: {
      items: I.map((it, n) => ({ texto: it.corto, tipo: 'color', bg: n ? 'bg-serie-4' : 'bg-serie-1' })),
      nota: `Promedio de acuerdo, de 0 (total desacuerdo) a 5 (total acuerdo), según la credibilidad promedio que les dan a cuatro titulares falsos · ${rondaCorta(Rd)}`,
    },
    grafica: {
      tipo: 'columnas-grupos',
      aria: `Promedio de acuerdo: ${Gs.map((g) => `${g.et.toLowerCase()} a los titulares falsos, ${I.map((it) => `${it.corto} ${fmt(it.grupos[g.k].media, 2)}`).join(', ')}`).join('; ')}.`,
      C,
    },
    metodo: [
      `<strong>La pregunta.</strong> «¿Qué tan de acuerdo o en desacuerdo está usted?», de 0 (total desacuerdo) a 5 (total acuerdo), con la afirmación ${I.map((it) => `«${it.texto}»`).join(' y ')}.`,
      `<strong>Los grupos.</strong> Credibilidad promedio que cada persona les da a cuatro titulares falsos, de 1 (definitivamente falsa) a 5 (definitivamente verdadera): ${T.map((t) => `«${t.texto}»`).join('; ')}. Les creen: promedio de más de 3. No les creen: promedio de 3 o menos.`,
      `<strong>Quiénes aparecen.</strong> Las ${I.map((it) => fmtN(it.n)).join(' y ')} personas que calificaron los cuatro titulares falsos y respondieron la afirmación en la ${Rd.label} (${Rd.fechas}). No se incluye la respuesta «No lo sé».`,
      `<strong>El dato.</strong> Promedio en cada grupo, sin ponderar. Diferencia entre grupos controlando por sexo, región, edad, educación e ideología (regresión lineal): ${I.map((it) => `${fmtSigno(it.dif_aj, 2)} (${pTexto(it.p_aj)})`).join('; ')}.`,
      `<strong>Los controles.</strong> Edad declarada en la 1.ª ronda. Educación en tres niveles. Ideología según la autoubicación de 0 (izquierda) a 10 (derecha) en la ${Rd.label}: izquierda (0 a 3), centro (4 a 6), derecha (7 a 10) y quienes no se ubican.`,
    ],
    fuente: fuente(`Preguntas Z10 (variables Z10_FakeNews1a a 4a) y Z20 (variable ${I.map((it) => it.var).join(', ')}); sexo: L_Gender; región: L_Region; edad: L_Age; educación: REC_EDUCATION_1_5; ideología: C_LRSelf_1_5.`),
    tablas: [
      {
        cabecera: ['Afirmación', ...Gs.map((g) => `${g.et} (credibilidad ${g.det})`), 'Diferencia con controles'],
        numericas: [1, 2, 3],
        filas: I.map((it) => [
          it.corto,
          ...Gs.map((g) => ({ v: fmt(it.grupos[g.k].media, 2), sub: `${fmtN(it.grupos[g.k].n)} personas` })),
          { v: fmtSigno(it.dif_aj, 2), sub: pTexto(it.p_aj) },
        ]),
        nota: `${Rd.label}, sin ponderar. Escala de 0 (total desacuerdo) a 5 (total acuerdo). Controles: sexo, región, edad, educación e ideología.`,
      },
    ],
  };
}

function desVerificacion(): HallazgoVisor {
  const C = D.desinformacion_verificacion;
  const F = C.fuentes;
  const Rd = C.ronda;
  return {
    id: 'dve',
    tema: 'desinformacion',
    etiqueta: 'Desinformación',
    titulo: '¿A qué recurren para verificar una noticia que parece falsa?',
    leyenda: { items: [], nota: `% de personas que pone cada fuente en el primer lugar · ${rondaCorta(Rd)}` },
    grafica: {
      tipo: 'ranking',
      aria: `Fuente a la que recurren primero para verificar: ${F.map((f) => `${f.nombre}, ${fmt(f.pct_primero)} %`).join('; ')}.`,
      filas: F.map((f) => ({ nombre: f.nombre, pct: f.pct_primero, tip: `${f.nombre}\nLa pone en el primer lugar: ${fmt(f.pct_primero)} %` })),
    },
    metodo: [
      `<strong>La pregunta.</strong> «¿Cuándo usted quiere verificar información política que le parece puede ser falsa a quién recurre? Haga un ranking donde 1 es a quien más suele recurrir, y 6 al que menos recurre para verificar información». Opciones, en orden aleatorio: ${F.map((f) => f.nombre.toLowerCase()).join(', ')}.`,
      '<strong>El cálculo.</strong> Para cada fuente, el porcentaje de personas que la ubica en el primer lugar de su ranking. Como cada persona pone una sola fuente en el primer lugar, los porcentajes suman 100 %.',
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(C.n)} personas que respondieron la pregunta en la ${Rd.label} (${Rd.fechas}).`,
      '<strong>El dato.</strong> Porcentajes sin ponderar.',
    ],
    fuente: fuente('Pregunta Z11 (variables Z11_VerifRank_1_5_1 a Z11_VerifRank_1_5_6).'),
    tablas: [
      {
        cabecera: ['Fuente', 'La pone en el primer lugar'],
        numericas: [1],
        filas: F.map((f) => [f.nombre, `${fmt(f.pct_primero)} %`]),
        nota: `${fmtN(C.n)} personas, ${Rd.label}, sin ponderar.`,
      },
    ],
  };
}

/* =============================================================== POPULISMO */

function popItems(): HallazgoVisor {
  const C = D.populismo_items;
  const I = C.items;
  const R = C.rondas;
  const dif = (it: (typeof I)[number]) => Math.round((it.media[1]! - it.media[0]!) * 100) / 100;
  return {
    id: 'pit',
    tema: 'populismo',
    etiqueta: 'Populismo',
    titulo: '¿Con qué ideas populistas están de acuerdo, antes y después de votar?',
    leyenda: {
      items: R.map((r, j) => ({ texto: rondaCorta(r), tipo: 'color', bg: j ? 'bg-serie-1' : 'bg-serie-4' })),
      nota: 'Promedio de acuerdo, de 0 (total desacuerdo) a 5 (total acuerdo) · mismas personas en ambas rondas · cambio resaltado: estadísticamente significativo',
    },
    grafica: {
      tipo: 'pesas-rondas',
      aria: `Promedio de acuerdo con cada afirmación populista: ${I.map((it) => `${it.corto}, ${fmt(it.media[0]!, 2)} en la ${R[0]!.label} y ${fmt(it.media[1]!, 2)} en la ${R[1]!.label}`).join('; ')}.`,
      C,
    },
    metodo: [
      `<strong>La pregunta.</strong> Acuerdo de 0 (total desacuerdo) a 5 (total acuerdo) con ocho afirmaciones: ${I.map((it) => `«${it.texto}»`).join('; ')}.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(C.n)} personas que respondieron las ocho afirmaciones en la ${R[0]!.label} (${R[0]!.fechas}) y en la ${R[1]!.label} (${R[1]!.fechas}). No se incluye la respuesta «No lo sé».`,
      '<strong>El dato.</strong> Promedio de acuerdo con cada afirmación en cada ronda, sin ponderar. El cambio es la diferencia entre los promedios que muestra el gráfico; se resalta cuando es estadísticamente significativo (prueba t pareada, p < 0,05).',
      '<strong>El eje.</strong> El eje horizontal va de 2,5 a 4,5.',
    ],
    fuente: fuente('Pregunta Z4 (variables Z4_Pop_1 a Z4_Pop_8).'),
    tablas: [
      {
        cabecera: ['Afirmación', ...R.map((r) => r.label), 'Cambio'],
        numericas: [1, 2, 3],
        filas: I.map((it) => [it.corto, ...it.media.map((v) => fmt(v, 2)), { v: fmtSigno(dif(it), 2), sub: pTexto(it.p) }]),
        nota: `${fmtN(C.n)} personas, sin ponderar. Promedio de 0 (total desacuerdo) a 5 (total acuerdo). Cambio: diferencia entre los promedios redondeados; prueba t pareada.`,
      },
    ],
  };
}

function popIdeologico(): HallazgoVisor {
  const C = D.populismo_ideologico;
  const K = C.constructos;
  const Rd = C.ronda;
  const [Dr, Iz] = K as [(typeof K)[number], (typeof K)[number]];
  return {
    id: 'pid',
    tema: 'populismo',
    etiqueta: 'Populismo',
    titulo: '¿Pesa más el populismo de derecha o el de izquierda?',
    leyenda: { items: [], nota: `Promedio de acuerdo, de 0 (total desacuerdo) a 5 (total acuerdo) · ${rondaCorta(Rd)}` },
    grafica: {
      tipo: 'constructos',
      aria: `Promedio de acuerdo: ${K.map((k) => `${k.nombre.toLowerCase()}, ${fmt(k.media, 2)}`).join('; ')}, de 0 a 5.`,
      C,
    },
    metodo: [
      `<strong>La pregunta.</strong> Acuerdo de 0 (total desacuerdo) a 5 (total acuerdo) con cuatro afirmaciones.<ul>${K.map((k) => `<li>${k.nombre}: ${k.items.map((it) => `«${it.texto}»`).join('; ')}.</li>`).join('')}</ul>`,
      '<strong>El cálculo.</strong> Para cada persona, el promedio de sus respuestas a las dos afirmaciones de cada tipo de populismo. Luego, el promedio de todas las personas. Las barras finas son el promedio de cada afirmación.',
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(C.n)} personas que respondieron las cuatro afirmaciones en la ${Rd.label} (${Rd.fechas}). No se incluye la respuesta «No lo sé».`,
      `<strong>El dato.</strong> Promedios sin ponderar. Diferencia entre populismo de izquierda y de derecha: ${fmtSigno(Iz.media - Dr.media, 2)} puntos (prueba t pareada, ${pTexto(C.p)}).`,
    ],
    fuente: fuente('Pregunta Z21 (variables Z21_Pop1, Z21_Pop2, Z21_Pop3 y Z21_Pop).'),
    tablas: [
      {
        cabecera: ['Afirmación', 'Promedio'],
        numericas: [1],
        filas: K.flatMap((k) => [
          [`${k.nombre} (promedio)`, fmt(k.media, 2)],
          ...k.items.map((it) => [it.corto, fmt(it.media, 2)]),
        ]),
        nota: `${fmtN(C.n)} personas, ${Rd.label}, sin ponderar. Escala de 0 (total desacuerdo) a 5 (total acuerdo).`,
      },
    ],
  };
}

function popIdeologia(): HallazgoVisor {
  const C = D.populismo_ideologia;
  const T = C.tramos;
  const K = C.constructos;
  const Rd = C.ronda;
  const P = D.populismo_ideologico.constructos;
  return {
    id: 'pil',
    tema: 'populismo',
    etiqueta: 'Populismo · Ideología',
    titulo: '¿Son más populistas los extremos ideológicos?',
    leyenda: {
      items: K.map((k, i) => ({ texto: k.nombre, tipo: 'grupo', i })),
      nota: `Promedio de acuerdo, de 0 (total desacuerdo) a 5 (total acuerdo), según la autoubicación de 0 (izquierda) a 10 (derecha) · ${rondaCorta(Rd)}`,
    },
    grafica: {
      tipo: 'lineas-ideologia',
      aria: `Populismo según ideología: ${T.map((t) => `${t.num} ${t.nombre}, derecha ${fmt(t.derecha, 2)} e izquierda ${fmt(t.izquierda, 2)}`).join('; ')}.`,
      C,
    },
    metodo: [
      `<strong>Las preguntas.</strong> Acuerdo de 0 (total desacuerdo) a 5 (total acuerdo) con cuatro afirmaciones.<ul>${P.map((k) => `<li>${k.nombre}: ${k.items.map((it) => `«${it.texto}»`).join('; ')}.</li>`).join('')}</ul>`,
      '<strong>El cálculo.</strong> Para cada persona, el promedio de sus respuestas a las dos afirmaciones de cada tipo de populismo. Luego, el promedio en cada tramo de ideología.',
      `<strong>Los tramos.</strong> Autoubicación en la escala de 0 (izquierda) a 10 (derecha) en la ${Rd.label}: ${T.map((t) => `${t.num} ${t.nombre} (${fmtN(t.n)} personas)`).join(', ')}.`,
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(C.n)} personas que respondieron las cuatro afirmaciones y se ubicaron en la escala en la ${Rd.label} (${Rd.fechas}). No se incluye la respuesta «No lo sé».`,
      `<strong>El dato.</strong> Promedios sin ponderar. Diferencias entre tramos (análisis de varianza): ${K.map((k) => `${k.nombre.toLowerCase()}, ${pTexto(C.p[k.clave as 'derecha' | 'izquierda'])}`).join('; ')}.`,
    ],
    fuente: fuente('Preguntas Z21 (variables Z21_Pop1, Z21_Pop2, Z21_Pop3 y Z21_Pop) y C_LRSelf (variable C_LRSelf_1_5).'),
    tablas: [
      {
        cabecera: ['Ideología', 'Personas', ...K.map((k) => k.nombre)],
        numericas: [1, 2, 3],
        filas: T.map((t) => [`${t.num} · ${t.nombre}`, fmtN(t.n), fmt(t.derecha, 2), fmt(t.izquierda, 2)]),
        nota: `${Rd.label}, sin ponderar. Escala de 0 (total desacuerdo) a 5 (total acuerdo).`,
      },
    ],
  };
}

/* ================================================ INTELIGENCIA ARTIFICIAL */

const IA_TITULOS: Record<string, string> = {
  IA1: '¿Usan la IA para informarse de política?',
  IA3: '¿Usan la IA para conocer a los candidatos?',
  IA4: '¿Confían en la IA para conocer las propuestas de los candidatos?',
  IA5: '¿Le creen a la IA tanto como a las personas?',
};

const ia = (['IA1', 'IA3', 'IA4', 'IA5'] as const).map((k) =>
  distribucion({
    id: k.toLowerCase(),
    tema: 'inteligencia-artificial',
    etiqueta: 'Inteligencia artificial',
    titulo: IA_TITULOS[k]!,
    it: D.ia_items.items[k],
    Rd: D.ia_items.ronda,
  }),
);

/* ===================================================== CONSUMO MEDIÁTICO */

function conRedes(): HallazgoVisor {
  const C = D.consumo_redes;
  const F = C.redes;
  const Rd = C.ronda;
  return {
    id: 'cre',
    tema: 'consumo-mediatico',
    etiqueta: 'Consumo mediático',
    titulo: '¿Qué redes sociales usan más?',
    leyenda: { items: [], nota: `% que usa cada red con frecuencia (4 o 5, de 0 = nunca a 5 = frecuentemente) · ${rondaCorta(Rd)}` },
    grafica: {
      tipo: 'ranking',
      aria: `Uso frecuente de redes sociales: ${F.map((f) => `${f.nombre}, ${fmt(f.pct_alto)} %`).join('; ')}.`,
      max: 100,
      filas: F.map((f) => ({
        nombre: f.nombre,
        pct: f.pct_alto,
        sub: `promedio ${fmt(f.media, 2)}`,
        tip: `${f.nombre}\nLa usa con frecuencia (4 o 5): ${fmt(f.pct_alto)} %\nPromedio de 0 a 5: ${fmt(f.media, 2)}`,
      })),
    },
    metodo: [
      `<strong>La pregunta.</strong> «En una escala de 0 a 5, donde 0 significa nunca y 5 frecuentemente, ¿con qué frecuencia utiliza las siguientes redes sociales?»: ${F.map((f) => f.nombre).join(', ')}.`,
      '<strong>Con frecuencia.</strong> Personas que responden 4 o 5.',
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(F[0]!.n)} personas que respondieron en la ${Rd.label} (${Rd.fechas}).`,
      '<strong>El dato.</strong> Porcentaje que usa cada red con frecuencia y promedio de la escala, sin ponderar. Las redes van de mayor a menor porcentaje.',
    ],
    fuente: fuente('Pregunta Z3 (variables Z3_Freq_Redes_1 a Z3_Freq_Redes_5).'),
    tablas: [
      {
        cabecera: ['Red social', 'La usa con frecuencia (4 o 5)', 'Promedio (0 a 5)'],
        numericas: [1, 2],
        filas: F.map((f) => [f.nombre, `${fmt(f.pct_alto)} %`, fmt(f.media, 2)]),
        nota: `${fmtN(F[0]!.n)} personas, ${Rd.label}, sin ponderar.`,
      },
    ],
  };
}

function conChats(): HallazgoVisor {
  const C = D.consumo_chats;
  const R = C.rondas;
  const K = C.cats;
  const dif = Math.round(R[1]!.pct_si) - Math.round(R[0]!.pct_si);
  const BG = ['bg-chart-track', 'bg-seq-2', 'bg-seq-4', 'bg-seq-6'];
  return {
    id: 'cch',
    tema: 'consumo-mediatico',
    etiqueta: 'Consumo mediático',
    titulo: '¿Reciben o comparten política por chats y redes?',
    leyenda: {
      items: K.map((k, i) => ({ texto: k, tipo: 'color', bg: BG[i] })),
      nota: '% de personas que en las últimas semanas recibió o compartió información política por un chat, una red social o una aplicación de mensajería · mismas personas en ambas rondas',
    },
    grafica: {
      tipo: 'chats',
      aria: `Recibió o compartió información política por chats o redes: ${R.map((r) => `${r.label}, ${Math.round(r.pct_si)} %`).join('; ')}.`,
      C,
    },
    metodo: [
      `<strong>La pregunta.</strong> «Durante las últimas semanas, ¿ha recibido o compartido información política a través de un chat, una red social o una aplicación de mensajería?». Respuestas: ${K.map((k) => k.toLowerCase()).join(', ')}.`,
      '<strong>¿Por dónde?</strong> Entre quienes responden que sí, las respuestas a «¿Cuál de estos medios utiliza para recibir o compartir noticias políticas con otras personas?», con varias respuestas posibles. Se muestran mensajería, redes sociales, correo electrónico y SMS.',
      `<strong>Quiénes aparecen.</strong> Las ${fmtN(C.n)} personas que respondieron en la ${R[0]!.label} (${R[0]!.fechas}) y en la ${R[1]!.label} (${R[1]!.fechas}). No se incluye la respuesta «No lo recuerdo». En «¿Por dónde?», quienes respondieron que sí en cada ronda: ${R.map((r) => `${fmtN(r.n_si)} en la ${r.label}`).join(' y ')}.`,
      `<strong>El dato.</strong> Porcentajes sin ponderar. El cambio es la diferencia en puntos entre los porcentajes de «sí» redondeados; se resalta cuando es estadísticamente significativo (prueba de McNemar, ${pTexto(C.p)}).`,
    ],
    fuente: fuente('Preguntas D_Net (variables D_Net_1 y D_Net_2) y D_Platform (variables D_Platform_1 y D_Platform_2).'),
    tablas: [
      {
        titulo: '¿Recibió o compartió información política?',
        cabecera: ['Respuesta', ...R.map((r) => r.label)],
        numericas: [1, 2],
        filas: [
          ...K.map((k, j) => [k, ...R.map((r) => `${fmt(r.dist[j]!)} %`)]),
          ['Sí (cualquiera de las tres)', ...R.map((r) => `${fmt(r.pct_si)} %`)],
        ],
        nota: `${fmtN(C.n)} personas en ambas rondas. Cambio en «sí»: ${fmtSigno(dif, 0)} pts (${pTexto(C.p)}).`,
      },
      {
        titulo: '¿Por dónde? Entre quienes sí',
        cabecera: ['Vía', ...R.map((r) => r.label)],
        numericas: [1, 2],
        filas: [
          ...C.vias.map((v, k) => [v, ...R.map((r) => `${fmt(r.vias[k]!)} %`)]),
          ['Personas', ...R.map((r) => fmtN(r.n_si))],
        ],
        nota: 'Sin ponderar. Respuesta múltiple: los porcentajes pueden sumar más de 100 %.',
      },
    ],
  };
}

function conOdio(): HallazgoVisor {
  const C = D.consumo_odio;
  const P = C.pasos;
  const K = C.cats;
  const Rd = C.ronda;
  const BG = ['bg-chart-track', 'bg-seq-2', 'bg-seq-4', 'bg-seq-6'];
  const siNo = (p: (typeof P)[number]) => 'si_no' in p && p.si_no;
  return {
    id: 'cod',
    tema: 'consumo-mediatico',
    etiqueta: 'Consumo mediático',
    titulo: '¿Cuánto odio ven y viven en las redes?',
    leyenda: {
      items: K.map((k, i) => ({ texto: k, tipo: 'color', bg: BG[i] })),
      nota: `% de personas en plataformas digitales · a la derecha: % «a veces» o más; en la última fila, % que responde sí · ${rondaCorta(Rd)}`,
    },
    grafica: {
      tipo: 'odio',
      aria: `Odio en plataformas digitales: ${P.map((p) => `${p.corto}, ${Math.round(p.pct)} %`).join('; ')}.`,
      C,
    },
    metodo: [
      `<strong>Las preguntas.</strong> ${P.map((p) => `«${p.texto}»`).join(' ')}`,
      `<strong>Las respuestas.</strong> Las cuatro primeras: ${K.map((k) => k.toLowerCase()).join(', ')}. La última: sí o no.`,
      '<strong>El número a la derecha.</strong> En las cuatro primeras, % que responde «a veces», «la mayoría de las veces» o «siempre». En la última, % que responde sí.',
      `<strong>Quiénes aparecen.</strong> Las personas que respondieron cada pregunta en la ${Rd.label} (${Rd.fechas}): ${P.map((p) => `${fmtN(p.n)} en «${p.corto.toLowerCase()}»`).join(', ')}. No se incluye la respuesta «No lo sé».`,
      '<strong>El dato.</strong> Porcentajes sin ponderar.',
    ],
    fuente: fuente(`Pregunta Z25 (variables ${P.map((p) => p.var).join(', ')}).`),
    tablas: [
      {
        cabecera: ['Pregunta', ...K, 'A veces o más', 'Personas'],
        numericas: [1, 2, 3, 4, 5, 6],
        filas: P.filter((p) => !siNo(p)).map((p) => [p.corto, ...p.dist.map((v) => `${fmt(v)} %`), `${fmt(p.pct)} %`, fmtN(p.n)]),
      },
      {
        cabecera: ['Pregunta', 'Sí', 'No', 'Personas'],
        numericas: [1, 2, 3],
        filas: P.filter(siNo).map((p) => [p.corto, `${fmt(p.dist[1]!)} %`, `${fmt(p.dist[0]!)} %`, fmtN(p.n)]),
        nota: `${Rd.label}, sin ponderar.`,
      },
    ],
  };
}

/* ========================================================== POR TEMA */

const porTema: Record<string, HallazgoVisor[]> = {
  polarizacion: [
    mediaRondas({
      id: 'pol',
      tema: 'polarizacion',
      etiqueta: 'Polarización',
      titulo: '¿Nos fuimos alejando de quienes votan por otro candidato?',
      G: D.polarizacion_wapsv,
      polos: ['Aprecio solo por los votantes de un candidato', 'Igual aprecio por los votantes de todos'],
      aria: 'Distancia en el aprecio hacia los votantes de los distintos candidatos',
      texto: WAPSV_TEXTO,
      quienes: `Las ${fmtN(D.polarizacion_wapsv.panel.n)} personas que tienen el índice en las tres rondas. En la 3.ª ronda se incluye a quienes calificaron a los dos grupos de votantes.`,
      variables: 'Índice WAPS hacia los votantes (variables WAPSV).',
    }),
    mediaRondas({
      id: 'pll',
      tema: 'polarizacion',
      etiqueta: 'Polarización',
      titulo: '¿Se fue dividiendo más el aprecio por los candidatos?',
      G: D.polarizacion_wapsl,
      polos: ['Aprecio solo por un candidato', 'Igual aprecio por todos los candidatos'],
      aria: 'Distancia en el aprecio hacia los distintos candidatos',
      texto: WAPSL_TEXTO,
      quienes: `Las ${fmtN(D.polarizacion_wapsl.panel.n)} personas que tienen el índice en las tres rondas. En la 3.ª ronda se incluye a quienes calificaron a los dos candidatos.`,
      variables: 'Índice WAPS hacia los líderes (variables WAPSL).',
    }),
    polExtremos(),
    polSankey(),
  ],
  jovenes: [jovPolarizacion(), jovCepeda(), jovCredibilidad(), jovPopulismo(), jovIA(), jovMedios(), jovComparte()],
  desinformacion: [
    mediaRondas({
      id: 'dpr',
      tema: 'desinformacion',
      etiqueta: 'Desinformación',
      titulo: '¿Con qué frecuencia sienten que se topan con noticias falsas?',
      G: D.desinformacion_promedio,
      min: 1,
      max: 4,
      alto: 'responde «con frecuencia»',
      polos: ['Con frecuencia', 'Nunca'],
      aria: 'Frecuencia con que sienten que se encuentran con noticias inventadas',
      texto: [
        '<strong>La pregunta.</strong> «Algunas personas definen las noticias falsas como información falsa que es inventada con fines políticos o económicos y que tiene poca o ninguna relación con hechos reales. ¿Qué tan frecuentemente se encuentra con noticias políticas que usted considera son completamente inventadas?»',
        '<strong>La escala.</strong> 1 = nunca, 2 = casi nunca, 3 = algunas veces, 4 = con frecuencia.',
      ],
      quienes: `Las ${fmtN(D.desinformacion_promedio.panel.n)} personas que respondieron la pregunta en las tres rondas. No se incluye la respuesta «No lo sé».`,
      variables: 'Pregunta Z6 (variables Z6_Desiformacion).',
    }),
    titulares({
      id: 'dti',
      titulo: '¿Le creen más a las noticias verdaderas que a las falsas?',
      C: D.desinformacion_titulares,
      origen: 3,
      medio: 'Ni cierta ni falsa',
      polos: ['← Falsa', 'Verdadera →'],
      medida: 'Credibilidad promedio',
      escala: 'de 1 (definitivamente falsa) a 5 (definitivamente verdadera)',
      pregunta: '«¿Qué tan cierta considera usted esta información?»',
      alto: 'La cree cierta (4 o 5)',
      bajo: 'La cree falsa (1 o 2)',
      calculo:
        'Cada barra es el promedio de credibilidad de un titular. El promedio de los falsos y el de los verdaderos parten del promedio de cada persona en sus cuatro titulares. Las barras salen del 3 (ni cierta ni falsa) hacia la izquierda si el titular se ve más falso que cierto y hacia la derecha si se ve más cierto que falso.',
      variables: 'variables Z10_FakeNews1a a 4a y Z10_TrueNews1a a 4a',
    }),
    titulares({
      id: 'dco',
      titulo: '¿Compartirían más las noticias verdaderas que las falsas?',
      C: D.desinformacion_compartir,
      origen: 1,
      medio: 'Punto medio',
      polos: ['← No la compartiría', 'La compartiría →'],
      medida: 'Probabilidad promedio de compartirlo',
      escala: 'de 1 (definitivamente no la compartiría) a 5 (definitivamente la compartiría)',
      pregunta: 'Después de cada titular: «Si la viera en sus redes sociales, ¿qué tan probable sería que lo compartiera?»',
      alto: 'La compartiría (4 o 5)',
      bajo: 'No la compartiría (1 o 2)',
      calculo:
        'Cada barra es el promedio de un titular. El promedio de los falsos y el de los verdaderos parten del promedio de cada persona en sus cuatro titulares.',
      variables: 'variables Z10_FakeNews1b a 4b y Z10_TrueNews1b a 4b',
    }),
    desIA(),
    desVerificacion(),
  ],
  populismo: [popItems(), popIdeologico(), popIdeologia()],
  'inteligencia-artificial': ia,
  'consumo-mediatico': [
    conRedes(),
    conChats(),
    distribucion({
      id: 'cpu',
      tema: 'consumo-mediatico',
      etiqueta: 'Consumo mediático',
      titulo: '¿Cuántos días publicaron sus opiniones políticas?',
      it: D.consumo_publica,
      Rd: D.consumo_publica.ronda,
    }),
    distribucion({
      id: 'cma',
      tema: 'consumo-mediatico',
      etiqueta: 'Consumo mediático',
      titulo: '¿Sus medios apoyaban a su mismo candidato?',
      it: D.consumo_medios_acuerdo,
      Rd: D.consumo_medios_acuerdo.ronda,
    }),
    conOdio(),
  ],
};

/** Hallazgos de un tema: el principal (el de /resultados) y luego los del tema. */
export function hallazgosTema(tema: string): HallazgoVisor[] {
  const principal = principalPorTema(tema);
  return [...(principal ? [principal] : []), ...(porTema[tema] ?? [])];
}
