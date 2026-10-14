/**
 * Acceso tipado a los datos de la encuesta (`src/data/tablero.json`).
 *
 * El JSON se valida con Zod al importar este módulo: si su forma no coincide con
 * `src/lib/schema.ts`, el build falla con un mensaje claro.
 *
 * Todas las funciones son puras (solo leen el tablero ya validado).
 */
import raw from '../data/tablero.json';
import {
  parseTablero,
  type Cruce,
  type Grupo,
  type Indicador,
  type Meta,
  type PuntoSerie,
  type Socio,
  type SocioKey,
  type Tablero,
  type TemaData,
  type TemaKey,
} from './schema';

export type {
  Cruce,
  Grupo,
  Indicador,
  Meta,
  PuntoSerie,
  Socio,
  SocioKey,
  Tablero,
  TemaData,
  TemaKey,
} from './schema';

export const tablero: Tablero = parseTablero(raw);

/* ------------------------------------------------------------------ básicos */

export function getMeta(): Meta {
  return tablero.meta;
}

export function getTemas(): TemaData[] {
  return tablero.temas;
}

export function getTema(key: TemaKey): TemaData | undefined {
  return tablero.temas.find((t) => t.key === key);
}

export function getIndicadores(temaKey?: TemaKey): Indicador[] {
  return temaKey ? tablero.indicadores.filter((i) => i.tema === temaKey) : tablero.indicadores;
}

export function getIndicador(key: string): Indicador | undefined {
  return tablero.indicadores.find((i) => i.key === key);
}

export function getDestacados(temaKey?: TemaKey): Indicador[] {
  return getIndicadores(temaKey).filter((i) => i.destacado);
}

export interface Familia {
  familia: string;
  indicadores: Indicador[];
}

/** Indicadores del tema agrupados por `familia`, en el orden en que aparecen en el JSON. */
export function getFamilias(temaKey: TemaKey): Familia[] {
  const out: Familia[] = [];
  const idx = new Map<string, Familia>();
  for (const ind of getIndicadores(temaKey)) {
    let f = idx.get(ind.familia);
    if (!f) {
      f = { familia: ind.familia, indicadores: [] };
      idx.set(ind.familia, f);
      out.push(f);
    }
    f.indicadores.push(ind);
  }
  return out;
}

/** Variables sociodemográficas ordenadas por prioridad (edad, sexo, estudios, estrato). */
export function getSocioOrdenado(): Array<{ key: SocioKey } & Socio> {
  return (Object.entries(tablero.socio) as Array<[SocioKey, Socio]>)
    .map(([key, s]) => ({ key, ...s }))
    .sort((a, b) => a.prioridad - b.prioridad);
}

/** Valor más reciente de la serie (la ronda en que se calcularon los cruces). */
export function getUltimoValor(ind: Indicador): PuntoSerie {
  return ind.serie[ind.serie.length - 1]!;
}

/* ------------------------------------------------------------ significancia */

/**
 * Regla de los investigadores (PLAN.md §5.1): solo se muestra una diferencia entre grupos
 * si es significativa **y** se mantiene con controles sociodemográficos.
 */
export function cruceSignificativo(cruce: Cruce | null | undefined): boolean {
  return !!(cruce && cruce.significativo && cruce.aj && cruce.aj.significativo);
}

/** Cruces publicables del indicador, ordenados por prioridad de la variable socio. */
export function getCrucesSignificativos(ind: Indicador): Cruce[] {
  return Object.values(ind.cruces)
    .filter((c): c is Cruce => cruceSignificativo(c))
    .sort((a, b) => a.prioridad - b.prioridad);
}

/* ------------------------------------------------------- cambio entre rondas */

export type Direccion = 'sube' | 'baja' | 'estable';

export interface CambioRondas {
  desde: PuntoSerie;
  hasta: PuntoSerie;
  /** hasta.valor − desde.valor */
  delta: number;
  direccion: Direccion;
  /** `panel` = mismas personas en ambas rondas; `serie` = muestras de cada ronda. */
  fuente: 'panel' | 'serie';
}

/**
 * Compara la primera y la última ronda. Usa `serie_panel` (mismas personas) si tiene ≥ 2
 * puntos; si no, `serie`. Devuelve `null` si solo hay una ronda.
 *
 * Criterio de "estable": |delta| < √(ic₁² + ic₂²), es decir, el cambio es menor que el
 * semiancho aproximado del IC 95 % de la diferencia tratando ambas rondas como
 * independientes. Para datos panel esto es conservador (la correlación intra-persona
 * reduce la varianza real), así que solo llamamos "sube"/"baja" a cambios claros.
 */
export function getCambioRondas(ind: Indicador): CambioRondas | null {
  const usaPanel = !!ind.serie_panel && ind.serie_panel.length > 1;
  const s = usaPanel ? ind.serie_panel! : ind.serie;
  if (s.length < 2) return null;
  const desde = s[0]!;
  const hasta = s[s.length - 1]!;
  const delta = hasta.valor - desde.valor;
  const umbral = Math.hypot(desde.ic, hasta.ic);
  const direccion: Direccion = Math.abs(delta) < umbral ? 'estable' : delta > 0 ? 'sube' : 'baja';
  return { desde, hasta, delta, direccion, fuente: usaPanel ? 'panel' : 'serie' };
}

/* ------------------------------------------------------------------ jóvenes */

/** Código del grupo "18 a 30 años" en los cruces por edad. */
export const CODIGO_JOVENES = 1;

export interface DatoJovenes {
  indicador: Indicador;
  cruce: Cruce;
  joven: Grupo;
  /** Promedio simple de los demás grupos de edad. */
  resto: number;
  /** joven.valor − resto (mismas unidades que el indicador). */
  brecha: number;
  /** |brecha| / (esc_hi − esc_lo): permite comparar escalas distintas. */
  brechaRel: number;
  direccion: 'más' | 'menos';
}

/**
 * Indicadores donde la edad marca una diferencia publicable y el grupo de 18 a 30 años
 * se aparta del resto. Ordenados de mayor a menor brecha relativa a la escala.
 */
export function getJovenes(): DatoJovenes[] {
  const out: DatoJovenes[] = [];
  for (const ind of tablero.indicadores) {
    const cruce = ind.cruces.edad;
    if (!cruce || !cruceSignificativo(cruce)) continue;
    const joven = cruce.grupos.find((g) => g.code === CODIGO_JOVENES);
    const otros = cruce.grupos.filter((g) => g.code !== CODIGO_JOVENES);
    if (!joven || otros.length === 0) continue;
    const resto = otros.reduce((a, g) => a + g.valor, 0) / otros.length;
    const brecha = joven.valor - resto;
    out.push({
      indicador: ind,
      cruce,
      joven,
      resto,
      brecha,
      brechaRel: Math.abs(brecha) / (ind.esc_hi - ind.esc_lo),
      direccion: brecha >= 0 ? 'más' : 'menos',
    });
  }
  return out.sort((a, b) => b.brechaRel - a.brechaRel);
}

/* ------------------------------------------------------------------ gráficas */

export type ChartKind = 'waffle' | 'scale' | 'bars' | 'stacked' | 'thermometer';

/** Grupos de indicadores que se dibujan juntos como barras horizontales (PLAN §5.2). */
export const GRUPOS_BARRAS = {
  cm: { prefijo: 'cm_', titulo: 'Medios' },
  rs: { prefijo: 'rs_', titulo: 'Redes sociales' },
} as const;
export type GrupoBarras = keyof typeof GRUPOS_BARRAS;

export function grupoBarrasFor(ind: Pick<Indicador, 'key'>): GrupoBarras | null {
  for (const [k, g] of Object.entries(GRUPOS_BARRAS) as Array<
    [GrupoBarras, (typeof GRUPOS_BARRAS)[GrupoBarras]]
  >) {
    if (ind.key.startsWith(g.prefijo)) return k;
  }
  return null;
}

/** Gráfica que corresponde a cada indicador según PLAN.md §5.2. */
export function chartKindFor(ind: Pick<Indicador, 'key' | 'familia' | 'stat'>): ChartKind {
  if (ind.familia === 'ideologia' || ind.key.startsWith('lr_')) return 'stacked';
  if (ind.key.startsWith('th_')) return 'thermometer';
  if (grupoBarrasFor(ind)) return 'bars';
  return ind.stat === 'pct' ? 'waffle' : 'scale';
}

/* -------------------------------------------------------------------- cifras */

export interface Stats {
  rondas: number;
  personas: number;
  preguntas: number;
  regiones: number;
}

/** Cifras del inicio / resultados ("3 rondas · 2.008 personas · 53 preguntas · 4 regiones"). */
export function getStats(): Stats {
  return {
    rondas: Object.keys(tablero.meta.n_olas).length,
    personas: tablero.meta.n_total,
    // TODO(PLAN §9): confirmar con el equipo si la cifra a mostrar es el n.º de indicadores.
    preguntas: tablero.indicadores.length,
    // TODO: no hay regiones en los datos; viene de la ficha técnica (Atlántica, Central,
    // Pacífica, Amazonía-Orinoquía).
    regiones: 4,
  };
}
