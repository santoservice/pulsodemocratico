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

/* ------------------------------------------------------------------ títulos */

/**
 * Convierte un texto a "título" según la regla del cliente (tipo oración):
 * "¿cómo se hizo la encuesta?" → "¿Cómo se hizo la encuesta?".
 * - Solo va en mayúscula la primera letra; el resto se deja como está escrito
 *   (nombres propios y siglas: Colombia, CNEP, IA).
 * - Respeta signos iniciales (¿ ¡ « " ( …).
 */
export function titulo(texto: string): string {
  return texto.replace(/[\p{L}\p{N}]/u, (letra) => letra.toLocaleUpperCase('es'));
}
