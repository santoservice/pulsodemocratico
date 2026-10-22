/**
 * Frases en lenguaje sencillo generadas desde los datos ("27 de cada 100 encuestados…").
 *
 * Regla de los investigadores (PLAN.md §5.1): la muestra no es probabilística → nunca
 * "colombianos", "del país" ni "nacional" como afirmación sobre la población; siempre
 * "personas encuestadas" / "encuestados". Sin margen de error.
 * Todos los números pasan por `format.ts`.
 */
import { decimal, entero, pct, pctOrMedia, SIGNO_MENOS } from './format';
import {
  getCambioRondas,
  getUltimoValor,
  GRUPOS_BARRAS,
  type DatoJovenes,
  type DefGrupoBarras,
  type Indicador,
  type Tarjeta,
} from './tablero';

export const ENCUESTADOS = 'encuestados';

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------ etiquetas */

/** Etiqueta corta para barras y termómetros ("Usa TikTok con frecuencia" → "TikTok"). */
export function etiquetaCorta(ind: Indicador): string {
  if (ind.key.startsWith('th_')) return ind.titulo.replace(/^Simpatía hacia\s+/i, '');
  for (const g of Object.values(GRUPOS_BARRAS) as DefGrupoBarras[]) {
    if (g.patron.test(ind.key) && g.quitar) return mayuscula(ind.titulo.replace(g.quitar, ''));
  }
  return ind.titulo;
}

/* ---------------------------------------------------------- número grande */

export interface Titular {
  /** "27 %", "4,9". */
  valor: string;
  /** "de 10", "de 5", "en una escala de −4 a +4". */
  sufijo?: string;
}

/** Sufijo de una media según su escala: 0–10 → "de 10"; −4–4 → "en una escala de −4 a +4". */
export function sufijoEscala(ind: Pick<Indicador, 'esc_lo' | 'esc_hi'>): string {
  if (ind.esc_lo >= 0) return `de ${entero(ind.esc_hi)}`;
  return `en una escala de ${entero(ind.esc_lo)} a +${entero(ind.esc_hi)}`;
}

/** Número grande de un indicador en su última ronda. */
export function titularIndicador(ind: Indicador): Titular {
  const v = getUltimoValor(ind).valor;
  if (ind.stat === 'pct') return { valor: pct(v) };
  return { valor: decimal(v), sufijo: sufijoEscala(ind) };
}

/* ------------------------------------------------------------- frases */

/** Verbos (3.ª persona singular) que aparecen al inicio de los títulos `pct`. */
const VERBOS = new Set(['ubica', 'siente', 'informa', 've', 'usa', 'cree', 'distingue']);
const CLITICOS = new Set(['se', 'le', 'no']);
const ADJ_PLURAL: Record<string, string> = { cercano: 'cercanos', cercana: 'cercanas' };

/**
 * Pasa a plural el verbo inicial de un título ("Se ubica en la izquierda" → "se ubican en la
 * izquierda"). Devuelve `null` si el título no empieza por un verbo conocido.
 */
export function predicadoPlural(titulo: string): string | null {
  const w = titulo.split(' ');
  let k = 0;
  while (k < w.length - 1 && CLITICOS.has(w[k]!.toLowerCase())) k++;
  const verbo = w[k]?.toLowerCase();
  if (!verbo || !VERBOS.has(verbo)) return null;
  w[k] = `${verbo}n`;
  // Concordancia de adjetivos que siguen al verbo ("se sienten cercanos").
  return minuscula(w.map((x) => ADJ_PLURAL[x] ?? x).join(' '));
}

/** "27 de cada 100 encuestados se ubican en la izquierda." */
export function frasePct(ind: Indicador, valor = getUltimoValor(ind).valor): string {
  const n = `${entero(valor)} de cada 100 ${ENCUESTADOS}`;
  const t = ind.titulo.trim();
  if (t.startsWith('«')) return `${n} están de acuerdo con la frase ${t}.`;
  const pred = predicadoPlural(t);
  if (pred) return `${n} ${pred}.`;
  return `${n}: ${minuscula(t)}.`;
}

/** "En promedio, 9,1 de 10: muy cerca de «Rechazo total»." */
export function fraseMedia(ind: Indicador, valor = getUltimoValor(ind).valor): string {
  const base = `En promedio, las personas encuestadas marcan ${decimal(valor)} ${sufijoEscala(ind)}`;
  if (!ind.polos) return `${base}.`;
  const [a, b] = ind.polos;
  const p = (valor - ind.esc_lo) / (ind.esc_hi - ind.esc_lo);
  let donde: string;
  if (p < 0.2) donde = `muy cerca de «${a}»`;
  else if (p < 0.4) donde = `más cerca de «${a}»`;
  else if (p <= 0.6) donde = `a medio camino entre «${a}» y «${b}»`;
  else if (p <= 0.8) donde = `más cerca de «${b}»`;
  else donde = `muy cerca de «${b}»`;
  return `${base}: ${donde}.`;
}

/** "Subió 6 puntos desde la 1.ª ronda." / "Sin cambios claros entre rondas." / null (1 ronda). */
export function fraseCambio(ind: Indicador): string | null {
  const c = getCambioRondas(ind);
  if (!c) return null;
  if (c.direccion === 'estable') return 'Sin cambios claros entre rondas.';
  const mag = Math.abs(c.delta);
  const cuanto = ind.stat === 'pct' ? entero(mag) : decimal(mag);
  const unidad = cuanto === '1' ? 'punto' : 'puntos';
  const verbo = c.direccion === 'sube' ? 'Subió' : 'Bajó';
  return `${verbo} ${cuanto} ${unidad} desde la ${c.desde.label}.`;
}

/** Frase principal de un indicador (sin el cambio entre rondas). */
export function fraseIndicador(ind: Indicador): string {
  return ind.stat === 'pct' ? frasePct(ind) : fraseMedia(ind);
}

/* ------------------------------------------------------------- tarjetas */

const ultimo = (i: Indicador) => getUltimoValor(i).valor;
const mayor = (xs: Indicador[]) => xs.reduce((a, b) => (ultimo(b) > ultimo(a) ? b : a));
const menor = (xs: Indicador[]) => xs.reduce((a, b) => (ultimo(b) < ultimo(a) ? b : a));

/**
 * En la gráfica apilada, el indicador "protagonista": el de mayor cambio claro entre rondas;
 * si ninguno cambia, el más grande.
 */
export function protagonistaApilada(xs: Indicador[]): Indicador {
  const conCambio = xs
    .map((i) => ({ i, c: getCambioRondas(i) }))
    .filter((x) => x.c && x.c.direccion !== 'estable')
    .sort((a, b) => Math.abs(b.c!.delta) - Math.abs(a.c!.delta));
  return conCambio[0]?.i ?? mayor(xs);
}

/** Número grande de una tarjeta. */
export function titularTarjeta(t: Tarjeta): Titular {
  const xs = t.indicadores;
  switch (t.tipo) {
    case 'bars':
      return titularIndicador(mayor(xs));
    case 'stacked':
      return titularIndicador(protagonistaApilada(xs));
    case 'thermometer':
      return titularIndicador(mayor(xs));
    default:
      return titularIndicador(xs[0]!);
  }
}

const FRASES_GRUPO: Record<string, (label: string, n: string) => string> = {
  cm: (l, n) => `${l} son la fuente más frecuente: ${n} se informan así.`,
  rs: (l, n) => `${l} es la red más usada: ${n} la usan con frecuencia.`,
  pop: (l, n) => `La frase con más apoyo es ${l}: ${n} están de acuerdo.`,
  fk: (l, n) => `El titular falso más creído: «${l.replace(/[«»]/g, '')}» (${n}).`,
  // iaUso / iaConf: los títulos empiezan por verbo → frasePct del más alto.
};

/** Frase de una línea de la tarjeta (incluye el cambio entre rondas si lo hay). */
export function resumenTarjeta(t: Tarjeta): string {
  const xs = t.indicadores;
  switch (t.tipo) {
    case 'bars': {
      const top = mayor(xs);
      const n = `${entero(ultimo(top))} de cada 100 ${ENCUESTADOS}`;
      const f = t.grupo && FRASES_GRUPO[t.grupo];
      const label = top.key.startsWith('pop_') ? top.titulo : etiquetaCorta(top);
      return f ? f(label, n) : frasePct(top);
    }
    case 'stacked': {
      const p = protagonistaApilada(xs);
      return [frasePct(p), fraseCambio(p)].filter(Boolean).join(' ');
    }
    case 'thermometer': {
      const a = mayor(xs);
      const b = menor(xs);
      return `El que más agrada: ${etiquetaCorta(a)} (${decimal(ultimo(a))} de 10). El que menos: ${etiquetaCorta(b)} (${decimal(ultimo(b))}).`;
    }
    default: {
      const i = xs[0]!;
      const cambio = fraseCambio(i);
      return [fraseIndicador(i), cambio && !cambio.startsWith('Sin') ? cambio : null]
        .filter(Boolean)
        .join(' ');
    }
  }
}

/* -------------------------------------------------------------- jóvenes */

/**
 * Brecha jóvenes − resto calculada con los valores YA redondeados que se muestran
 * (48 % frente a 26 % → 22 puntos), para que la resta "cuadre" a ojos del lector.
 */
export function brechaMostrada(d: DatoJovenes): number {
  const f = d.indicador.stat === 'pct' ? 1 : 10;
  const r = (v: number) => Math.round(v * f) / f;
  return Math.round((r(d.joven.valor) - r(d.resto)) * f) / f;
}

function cuantoJovenes(d: DatoJovenes): string {
  const mag = Math.abs(brechaMostrada(d));
  return d.indicador.stat === 'pct' ? entero(mag) : decimal(mag);
}

/** Brecha jóvenes − resto con unidades: "21 puntos" / "0,6 puntos". */
export function brechaJovenes(d: DatoJovenes): string {
  const cuanto = cuantoJovenes(d);
  return `${cuanto} ${cuanto === '1' ? 'punto' : 'puntos'}`;
}

/** Titular de la tarjeta de jóvenes: "+21" + "puntos". */
export function titularJovenes(d: DatoJovenes): Titular {
  const cuanto = cuantoJovenes(d);
  const signo = d.brecha >= 0 ? '+' : SIGNO_MENOS;
  return { valor: `${signo}${cuanto}`, sufijo: cuanto === '1' ? 'punto' : 'puntos' };
}

/** "Los jóvenes de 18 a 30 años marcan 48 % frente a 26 % del resto: 21 puntos más." */
export function resumenJovenes(d: DatoJovenes): string {
  const ind = d.indicador;
  return `Los jóvenes de 18 a 30 años marcan ${pctOrMedia(ind, d.joven.valor)} frente a ${pctOrMedia(ind, d.resto)} del resto de ${ENCUESTADOS}: ${brechaJovenes(d)} ${d.direccion}.`;
}
