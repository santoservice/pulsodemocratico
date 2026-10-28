/**
 * Lógica del quiz «¿Dónde te ubicas frente al resto del país?» (PLAN.md §5.3).
 * Funciones puras, sin acceso a datos: la configuración vive en `src/data/quiz.ts`.
 *
 * Decisión del cliente: NO hay un puntaje combinado. Cada pregunta se compara por separado
 * con las personas encuestadas y al final se resumen las 4 comparaciones.
 *   - `modo: 'porcentaje'`: la persona queda dentro o fuera de un grupo (p. ej. quienes
 *     responden 3 o 4) y se muestra qué % de los encuestados está en ese grupo.
 *   - `modo: 'promedio'`: se ubica la respuesta en la escala frente al promedio.
 *
 * Wording (muestra no probabilística, PLAN.md §5.1): siempre `PROMEDIO_ENCUESTADOS`, nunca
 * "promedio nacional"; los % siempre "de los encuestados".
 */
import { decimal, entero, pct, PCT_SEPARADOR } from './format';

/** Única forma de nombrar la referencia del quiz en todo el sitio. */
export const PROMEDIO_ENCUESTADOS = 'promedio de los encuestados';
/** Complemento de los porcentajes ("80 % de los encuestados"). */
export const DE_LOS_ENCUESTADOS = 'de los encuestados';

export interface OpcionQuiz {
  valor: number;
  etiqueta: string;
}

export interface ComparacionPorcentaje {
  modo: 'porcentaje';
  /** Respuestas que cuentan como "dentro del grupo". */
  valoresGrupo: readonly number[];
  /** % de los encuestados (respuestas válidas) que está en el grupo, 0–100. */
  valor: number;
  /** Predicado en 3.ª persona singular: "dice encontrarse con noticias falsas…". */
  descripcionGrupo: string;
  /** Predicado para quienes quedan fuera del grupo. */
  descripcionFuera: string;
  /** Etiqueta corta del grupo para la gráfica ("Algunas veces o con frecuencia"). */
  etiquetaGrupo: string;
  etiquetaFuera: string;
}

export interface ComparacionPromedio {
  modo: 'promedio';
  /** Promedio de los encuestados en la escala de la pregunta. */
  valor: number;
}

export type Comparacion = ComparacionPorcentaje | ComparacionPromedio;

/**
 * Gráfica del resultado de cada pregunta (todas usan `distribucion`):
 * - `columnas`: una columna por respuesta; «Tú» cae sobre la tuya.
 * - `barra`: una barra partida en tramos (ancho = % que dio esa respuesta); «Tú» corre hasta el tuyo.
 * - `personas`: 100 personitas; se colorean las que están en `valores` y «Tú» se marca en su grupo.
 * - `pastel`: dos partes según `comparacion.valoresGrupo` (requiere `modo: 'porcentaje'`).
 * `si` / `no`: predicado corto para quienes están dentro / fuera del grupo ("le pusieron 0…").
 */
export type GraficaQuiz =
  | { tipo: 'columnas' }
  | { tipo: 'barra' }
  | { tipo: 'personas'; valores: readonly number[]; si: string; no: string }
  | { tipo: 'pastel'; si: string; no: string };

export interface PreguntaQuiz {
  id: string;
  /** Slug del tema en `src/data/temas.ts` (para "Ver resultados del tema"). */
  tema: string;
  /** Nombre del tema para mostrar ("Desinformación"). */
  temaTitulo: string;
  texto: string;
  tipo: 'opciones' | 'escala';
  /** Solo `tipo: 'opciones'`. */
  opciones?: readonly OpcionQuiz[];
  /** Solo `tipo: 'escala'`: valores enteros de `min` a `max`. */
  min?: number;
  max?: number;
  /** Etiquetas de [min, max] en la escala. */
  etiquetasExtremos?: readonly [string, string];
  comparacion: Comparacion;
  grafica: GraficaQuiz;
  /**
   * Dato curioso bajo el resultado: "{prefijo} **8 de cada 10 encuestados** {texto} (80 %)."
   * `valores`: respuestas que cuentan; `texto` concuerda con la cifra ("8 de cada 10 dicen…",
   * "1 de cada 4 responde…").
   */
  curioso?: { valores: readonly number[]; texto: string; prefijo?: string };
  /** Personas por respuesta (respuestas válidas). */
  distribucion: readonly { valor: number; n: number }[];
  /** Total de respuestas válidas. */
  n: number;
  /** "3.ª ronda". */
  ronda: string;
  fuente: string;
}

export type Posicion = 'por encima' | 'por debajo' | 'igual';

export interface Evaluacion {
  preguntaId: string;
  valor: number;
  /** Etiqueta de la respuesta ("Algunas veces", "4"). */
  etiqueta: string;
  /** Solo `modo: 'porcentaje'`. */
  dentroDelGrupo?: boolean;
  /** Solo `modo: 'promedio'`: respuesta − promedio. */
  diferencia?: number;
  /**
   * `promedio`: frente al promedio. `porcentaje`: 'por encima' si está dentro del grupo,
   * 'por debajo' si está fuera (no hay 'igual').
   */
  posicion: Posicion;
  /** % de los encuestados que dio exactamente la misma respuesta (0–100). */
  pctMismaRespuesta: number;
  /** Frase principal en español sencillo. */
  texto: string;
  /** "El 41 % de los encuestados respondió lo mismo que tú." */
  textoMismaRespuesta: string;
}

/**
 * En `modo: 'promedio'`, diferencias menores que esta fracción del rango de la escala se
 * leen como "prácticamente en el promedio" (como en el borrador del cliente: 8 %).
 */
export const UMBRAL_IGUAL_REL = 0.08;

/** Valores posibles de una pregunta, en orden. */
export function valoresPregunta(p: PreguntaQuiz): number[] {
  if (p.tipo === 'opciones') return (p.opciones ?? []).map((o) => o.valor);
  const { min = 0, max = 0 } = p;
  return Array.from({ length: max - min + 1 }, (_, k) => min + k);
}

/** [mín, máx] de la escala de la pregunta. */
export function rangoPregunta(p: PreguntaQuiz): [number, number] {
  const v = valoresPregunta(p);
  return [v[0] ?? 0, v[v.length - 1] ?? 0];
}

export function etiquetaRespuesta(p: PreguntaQuiz, valor: number): string {
  if (p.tipo === 'opciones') return p.opciones?.find((o) => o.valor === valor)?.etiqueta ?? '';
  return entero(valor);
}

/** Posición 0–100 de `v` en la escala de la pregunta. */
export function posicionEnEscala(p: PreguntaQuiz, v: number): number {
  const [lo, hi] = rangoPregunta(p);
  if (hi <= lo) return 0;
  return Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));
}

/** % de los encuestados que respondió `valor` (según la distribución). */
export function pctMismaRespuesta(p: PreguntaQuiz, valor: number): number {
  const total = p.distribucion.reduce((a, d) => a + d.n, 0);
  if (total === 0) return 0;
  const n = p.distribucion.find((d) => d.valor === valor)?.n ?? 0;
  return (n / total) * 100;
}

/** % de los encuestados en el grupo, calculado desde la distribución (para validar la config). */
export function pctGrupoDesdeDistribucion(p: PreguntaQuiz, valores: readonly number[]): number {
  return valores.reduce((a, v) => a + pctMismaRespuesta(p, v), 0);
}

/** Promedio calculado desde la distribución (para validar la config). */
export function promedioDesdeDistribucion(p: PreguntaQuiz): number {
  const total = p.distribucion.reduce((a, d) => a + d.n, 0);
  if (total === 0) return 0;
  return p.distribucion.reduce((a, d) => a + d.valor * d.n, 0) / total;
}

export function textoMismaRespuesta(pctMisma: number): string {
  if (pctMisma <= 0) return `Nadie entre las personas encuestadas respondió lo mismo que tú.`;
  if (pctMisma < 0.5) return `Menos del ${pct(1)} ${DE_LOS_ENCUESTADOS} respondió lo mismo que tú.`;
  return `El ${pct(pctMisma)} ${DE_LOS_ENCUESTADOS} respondió lo mismo que tú.`;
}

/** "Estás 1,2 puntos por encima del promedio de los encuestados." */
export function textoPromedio(diferencia: number, posicion: Posicion): string {
  if (posicion === 'igual') return `Estás prácticamente en el ${PROMEDIO_ENCUESTADOS}.`;
  const d = decimal(Math.abs(diferencia));
  const unidad = d === '1,0' ? 'punto' : 'puntos';
  return `Estás ${d} ${unidad} ${posicion} del ${PROMEDIO_ENCUESTADOS}.`;
}

/** Compara una respuesta con las personas encuestadas. Lanza error si el valor no es válido. */
export function evaluarRespuesta(p: PreguntaQuiz, valor: number): Evaluacion {
  if (!valoresPregunta(p).includes(valor)) {
    throw new Error(`Pregunta ${p.id}: respuesta fuera de la escala (${valor}).`);
  }
  const pctMisma = pctMismaRespuesta(p, valor);
  const base = {
    preguntaId: p.id,
    valor,
    etiqueta: etiquetaRespuesta(p, valor),
    pctMismaRespuesta: pctMisma,
    textoMismaRespuesta: textoMismaRespuesta(pctMisma),
  };
  const c = p.comparacion;
  if (c.modo === 'porcentaje') {
    const dentro = c.valoresGrupo.includes(valor);
    const texto = dentro
      ? `Haces parte del ${pct(c.valor)} ${DE_LOS_ENCUESTADOS} que ${c.descripcionGrupo}.`
      : `Haces parte del ${pct(100 - c.valor)} ${DE_LOS_ENCUESTADOS} que ${c.descripcionFuera}.`;
    return {
      ...base,
      dentroDelGrupo: dentro,
      posicion: dentro ? 'por encima' : 'por debajo',
      texto,
    };
  }
  const [lo, hi] = rangoPregunta(p);
  const diferencia = valor - c.valor;
  const posicion: Posicion =
    Math.abs(diferencia) < (hi - lo) * UMBRAL_IGUAL_REL
      ? 'igual'
      : diferencia > 0
        ? 'por encima'
        : 'por debajo';
  return { ...base, diferencia, posicion, texto: textoPromedio(diferencia, posicion) };
}

/** Trozo de texto; `b` = va en negrilla. */
export interface Trozo {
  t: string;
  b?: boolean;
}

/**
 * Lo que se lee en «Tu resultado»:
 * - `sello`: etiqueta corta según qué tan común es tu respuesta («Estás con la mayoría»).
 * - cifra grande (`valor` + `formato`) y `frase`, que la explica («de los encuestados… igual que tú»).
 * - `curioso`: un dato de contexto llamativo («8 de cada 10 encuestados…»), si la pregunta lo tiene.
 * - `contexto`: el promedio, en las preguntas de escala.
 */
export interface Destacado {
  /** Valor numérico de la cifra (0–100), para animarla. */
  valor: number;
  formato: 'pct' | 'de100';
  sello: string | null;
  frase: Trozo[];
  curioso: Trozo[] | null;
  contexto: string;
}

/**
 * Proporción en palabras: 79,7 → "8 de cada 10"; 76,8 → "casi 8 de cada 10";
 * 5,5 → "6 de cada 100". Por debajo del 10 % cuenta sobre 100 (pedido de los investigadores).
 */
export function deCada(porcentaje: number): string {
  const matiz = (real: number, redondo: number) =>
    real < redondo - 1 ? 'casi ' : real > redondo + 1 ? 'más de ' : '';
  if (porcentaje >= 9.5) {
    const n = Math.min(10, Math.round(porcentaje / 10));
    if (n === 10) return 'casi todos los';
    return `${matiz(porcentaje, n * 10)}${n} de cada 10`;
  }
  return `${Math.max(1, Math.round(porcentaje))} de cada 100`;
}

/** Sello según el % que dio tu misma respuesta. */
function selloRespuesta(pctMisma: number): string | null {
  if (pctMisma >= 50) return 'Estás con la mayoría';
  if (pctMisma < 15) return 'Respuesta poco común';
  return null;
}

export function destacadoResultado(p: PreguntaQuiz, valor: number): Destacado {
  const g = p.grafica;
  const c = p.comparacion;
  const contexto =
    c.modo === 'promedio'
      ? `${PROMEDIO_ENCUESTADOS[0]!.toUpperCase()}${PROMEDIO_ENCUESTADOS.slice(1)}: ${decimal(c.valor)} (de ${rangoPregunta(p)[0]} a ${rangoPregunta(p)[1]}).`
      : '';
  const cur = p.curioso;
  const pctCurioso = cur ? pctGrupoDesdeDistribucion(p, cur.valores) : 0;
  const quienes = `${deCada(pctCurioso)} encuestados`;
  const curioso: Trozo[] | null = cur
    ? [
        ...(cur.prefijo ? [{ t: `${cur.prefijo} ` }] : []),
        { t: cur.prefijo ? quienes : quienes.replace(/^./, (l) => l.toUpperCase()), b: true },
        { t: ` ${cur.texto} ` },
        // Por debajo del 10 % con un decimal (5,5 %): el entero se confunde con «N de cada 100».
        { t: `(${pctCurioso < 10 ? `${decimal(pctCurioso)}${PCT_SEPARADOR}%` : pct(pctCurioso)}).` },
      ]
    : null;

  if (g.tipo === 'personas' || g.tipo === 'pastel') {
    const valores = g.tipo === 'personas' ? g.valores : c.modo === 'porcentaje' ? c.valoresGrupo : [];
    const pctSi = pctGrupoDesdeDistribucion(p, valores);
    const dentro = valores.includes(valor);
    const v = dentro ? pctSi : 100 - pctSi;
    return {
      valor: v,
      formato: g.tipo === 'personas' ? 'de100' : 'pct',
      sello: selloRespuesta(v),
      frase: [
        { t: g.tipo === 'personas' ? 'encuestados ' : `${DE_LOS_ENCUESTADOS} ` },
        { t: dentro ? g.si : g.no, b: true },
        { t: ', igual que tú.' },
      ],
      curioso,
      contexto,
    };
  }
  const etiqueta = etiquetaRespuesta(p, valor);
  const misma = pctMismaRespuesta(p, valor);
  return {
    valor: misma,
    formato: 'pct',
    sello: selloRespuesta(misma),
    frase: [
      { t: `${DE_LOS_ENCUESTADOS} respondió ` },
      {
        t: p.tipo === 'opciones' ? `«${etiqueta}»` : `${etiqueta} de ${rangoPregunta(p)[1]}`,
        b: true,
      },
      { t: ', igual que tú.' },
    ],
    curioso,
    contexto,
  };
}

export type Respuestas = Readonly<Record<string, number | null | undefined>>;

export interface ResumenFinal {
  /** Evaluaciones de las preguntas respondidas, en el orden del quiz. */
  evaluaciones: Evaluacion[];
  respondidas: number;
  total: number;
  /** Frase de cierre en español sencillo. */
  texto: string;
}

const listaY = (xs: string[]) =>
  xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`;

/**
 * Resumen de todas las respuestas: una evaluación por pregunta respondida + una frase que
 * agrupa las preguntas de promedio por posición (no se combina en un puntaje).
 */
export function resumenFinal(
  preguntas: readonly PreguntaQuiz[],
  respuestas: Respuestas,
): ResumenFinal {
  const evaluaciones: Evaluacion[] = [];
  const grupos: Record<Posicion, string[]> = { 'por encima': [], 'por debajo': [], igual: [] };
  for (const p of preguntas) {
    const v = respuestas[p.id];
    if (v == null || !Number.isFinite(v)) continue;
    const e = evaluarRespuesta(p, v);
    evaluaciones.push(e);
    if (p.comparacion.modo === 'promedio') grupos[e.posicion].push(p.temaTitulo.toLowerCase());
  }
  const partes: string[] = [];
  if (grupos['por encima'].length) partes.push(`por encima en ${listaY(grupos['por encima'])}`);
  if (grupos['por debajo'].length) partes.push(`por debajo en ${listaY(grupos['por debajo'])}`);
  if (grupos.igual.length) partes.push(`muy cerca en ${listaY(grupos.igual)}`);
  const texto = partes.length ? `Frente al ${PROMEDIO_ENCUESTADOS}, estás ${listaY(partes)}.` : '';
  return { evaluaciones, respondidas: evaluaciones.length, total: preguntas.length, texto };
}
