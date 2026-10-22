/**
 * Formato de números en español de Colombia (PLAN.md §5.1).
 *
 * - Enteros con punto de miles: 2.008 (también para 4 cifras, a diferencia de
 *   `Intl` es-CO que no agrupa 4 cifras por defecto: forzamos `useGrouping: 'always'`).
 * - Porcentajes sin decimales: 27 %.
 * - Medias con 1 decimal y coma: 4,9.
 * - Signo menos tipográfico (U+2212) en diferencias: −1,0.
 */

/**
 * Separador entre número y "%". La norma (RAE / ISO) pide espacio; usamos espacio duro
 * (U+00A0) para que no se parta la línea. Cambiar a `''` para el estilo "27%".
 */
export const PCT_SEPARADOR = ' ';
export const SIGNO_MENOS = '−';

const fmtEntero = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
  useGrouping: 'always',
});

const fmtDecimal = new Map<number, Intl.NumberFormat>();
function decimalFormatter(dec: number): Intl.NumberFormat {
  let f = fmtDecimal.get(dec);
  if (!f) {
    f = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
      useGrouping: 'always',
    });
    fmtDecimal.set(dec, f);
  }
  return f;
}

/** Normaliza el signo menos ASCII y evita "−0". */
function limpiar(s: string): string {
  return s.replace(/^-/, SIGNO_MENOS).replace(new RegExp(`^${SIGNO_MENOS}(0(,0+)?)$`), '$1');
}

/** 2008 → "2.008" */
export function entero(v: number): string {
  return limpiar(fmtEntero.format(Math.round(v)));
}

/** 4.93 → "4,9" (1 decimal por defecto). */
export function decimal(v: number, decimales = 1): string {
  return limpiar(decimalFormatter(decimales).format(v));
}

/** 26.5 → "27 %" (sin decimales). */
export function pct(v: number): string {
  return `${entero(v)}${PCT_SEPARADOR}%`;
}

/** Diferencia con signo: 3.2 → "+3,2", -1 → "−1,0", 0 → "0,0". */
export function delta(v: number, decimales = 1): string {
  const s = decimal(v, decimales);
  if (s.startsWith(SIGNO_MENOS) || /^0(,0+)?$/.test(s)) return s;
  return `+${s}`;
}

interface ConStat {
  stat: 'pct' | 'media';
}

/** Número sin unidad según el tipo: pct → "27", media → "4,9". */
export function numero(ind: ConStat, v: number): string {
  return ind.stat === 'pct' ? entero(v) : decimal(v);
}

/** Valor listo para mostrar (equivale a `val()` del tablero original): "27 %" o "4,9". */
export function pctOrMedia(ind: ConStat, v: number): string {
  return ind.stat === 'pct' ? pct(v) : decimal(v);
}

/** Diferencia con signo según el tipo: pct → "+3" (puntos), media → "+0,4". */
export function deltaSegunStat(ind: ConStat, v: number): string {
  return delta(v, ind.stat === 'pct' ? 0 : 1);
}

/* ------------------------------------------------------------------ títulos */

/**
 * Palabras funcionales que van en minúscula dentro de un título (salvo al inicio).
 * Regla del cliente: mayúscula inicial en cada palabra, excepto artículos, preposiciones
 * y conjunciones cortas.
 */
export const PALABRAS_MENORES: ReadonlySet<string> = new Set([
  'a',
  'al',
  'con',
  'de',
  'del',
  'e',
  'el',
  'en',
  'la',
  'las',
  'lo',
  'los',
  'ni',
  'o',
  'para',
  'por',
  'que',
  'se',
  'sobre',
  'u',
  'un',
  'una',
  'y',
]);

/**
 * Convierte un texto a "título" según la regla del cliente:
 * "¿Cómo se hizo la encuesta?" → "¿Cómo se Hizo la Encuesta?".
 * - Mayúscula inicial en cada palabra; las de `PALABRAS_MENORES` en minúscula salvo al inicio.
 * - Respeta signos iniciales (¿ ¡ « " ( …) y no toca el resto de la palabra (siglas: CNEP, IA).
 * - Las partes de una palabra con guion se tratan por separado (Amazonía-Orinoquía).
 */
export function titulo(texto: string): string {
  let primera = true;
  return texto.replace(/[\p{L}\p{N}]+/gu, (palabra, offset: number) => {
    // Primera palabra del título, o tras un signo que abre frase (¿ ¡ : .).
    const previo = texto.slice(0, offset).trimEnd();
    const inicio = primera || /[¿¡:.]$/u.test(previo);
    primera = false;
    const minuscula = palabra.toLocaleLowerCase('es');
    if (!inicio && PALABRAS_MENORES.has(minuscula)) return minuscula;
    return palabra.charAt(0).toLocaleUpperCase('es') + palabra.slice(1);
  });
}
