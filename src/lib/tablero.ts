/**
 * Acceso tipado a los datos de la encuesta (`src/data/tablero.json`). Las gráficas del sitio
 * salen del visor (`src/lib/visor/`); de aquí solo se usan las cifras generales y la lista de
 * variables para los datos estructurados (JSON-LD).
 *
 * El JSON se valida con Zod al importar este módulo: si su forma no coincide con
 * `src/lib/schema.ts`, el build falla con un mensaje claro.
 *
 * Todas las funciones son puras (solo leen el tablero ya validado).
 */
import raw from '../data/tablero.json';
import { parseTablero, type Indicador, type Tablero, type TemaKey } from './schema';

export const tablero: Tablero = parseTablero(raw);

/* ------------------------------------------------------------------ básicos */

export function getIndicadores(temaKey?: TemaKey): Indicador[] {
  return temaKey ? tablero.indicadores.filter((i) => i.tema === temaKey) : tablero.indicadores;
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
