/**
 * Contenido del modal de detalle de una pregunta (PLAN.md §4.2). Funciones puras: textos del
 * "Detalle técnico" en español sencillo, serie para "Cambio entre rondas" y cruces publicables.
 * Todos los números pasan por `format.ts`.
 */
import { decimal, entero } from './format';
import {
  getCrucesSignificativos,
  getMeta,
  getUltimoValor,
  type Cruce,
  type Indicador,
  type PuntoSerie,
} from './tablero';

/** Id del bloque de contenido del modal de una tarjeta. */
export const idDetalle = (tarjetaId: string) => `detalle-${tarjetaId}`;

const NOMBRES_CONTROL: Record<string, string> = {
  sexo: 'sexo',
  edad: 'edad',
  educ: 'nivel de estudios',
  estrato: 'estrato',
  region: 'región',
};

/** ["sexo", "region"] → "sexo y región". */
export function listaControles(controles: readonly string[]): string {
  const xs = controles.map((c) => NOMBRES_CONTROL[c] ?? c);
  if (xs.length <= 1) return xs[0] ?? '';
  return `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`;
}

/** p-valor legible: 0,0004 → "menor que 0,001"; 0,0312 → "0,031". */
export function formatoP(p: number): string {
  return p < 0.001 ? 'menor que 0,001' : decimal(p, 3);
}

export function nombrePrueba(prueba: Cruce['prueba']): string {
  return prueba === 'chi2' ? 'ji cuadrado' : 'F (análisis de varianza)';
}

export function nombreEfecto(tipo: Cruce['efecto_tipo']): string {
  return tipo === 'V' ? 'V de Cramér' : 'eta cuadrado (η²)';
}

/** Diferencia entre el grupo más alto y el más bajo, con unidades. */
export function textoBrecha(c: Cruce, stat: Indicador['stat']): string {
  const v = stat === 'pct' ? entero(c.brecha) : decimal(c.brecha);
  return `${v} ${v === '1' || v === '1,0' ? 'punto' : 'puntos'}`;
}

/**
 * Una frase por cruce para el "Detalle técnico":
 * "Edad: 21 puntos entre el grupo más alto y el más bajo. Prueba ji cuadrado: p = 0,002;
 * V de Cramér = 0,12. Se mantiene al comparar personas de igual sexo y región (p = 0,004)."
 */
export function fraseCruceTecnica(c: Cruce, stat: Indicador['stat']): string {
  const partes = [
    `${c.socio_label}: ${textoBrecha(c, stat)} entre el grupo más alto y el más bajo (${entero(c.n)} personas).`,
    `Prueba ${nombrePrueba(c.prueba)}: p ${c.p < 0.001 ? '' : '= '}${formatoP(c.p)}; ${nombreEfecto(c.efecto_tipo)} = ${decimal(c.efecto, 2)}.`,
  ];
  if (c.aj.controles.length) {
    partes.push(
      `${c.aj.significativo ? 'Se mantiene' : 'No se mantiene'} al comparar personas de igual ${listaControles(c.aj.controles)} (p ${c.aj.p < 0.001 ? '' : '= '}${formatoP(c.aj.p)}).`,
    );
  }
  return partes.join(' ');
}

export interface FilaTecnica {
  etiqueta: string;
  valor: string;
}

/** Filas generales del "Detalle técnico" de un indicador. */
export function filasTecnicas(ind: Indicador): FilaTecnica[] {
  const u = getUltimoValor(ind);
  const meta = getMeta();
  const tecnica = meta.olas_tecnico[u.label];
  const filas: FilaTecnica[] = [
    { etiqueta: 'Ronda del dato', valor: tecnica ? `${u.label} (${tecnica})` : u.label },
    { etiqueta: 'Personas que respondieron', valor: entero(u.n) },
    {
      etiqueta: 'Tipo de dato',
      valor:
        ind.stat === 'pct'
          ? 'Porcentaje de las personas encuestadas'
          : `Promedio en una escala de ${entero(ind.esc_lo)} a ${entero(ind.esc_hi)}`,
    },
  ];
  if (ind.serie.length > 1) {
    filas.push({
      etiqueta: 'Rondas en que se preguntó',
      valor: ind.serie.map((s) => s.label).join(', '),
    });
  }
  return filas;
}

export interface SerieModal {
  serie: readonly PuntoSerie[];
  fuente: 'panel' | 'serie';
}

/**
 * Serie para "Cambio entre rondas": la de panel (mismas personas) si tiene ≥ 2 rondas; si no,
 * la serie general. `null` si la pregunta se hizo en una sola ronda.
 */
export function serieModal(ind: Indicador): SerieModal | null {
  if (ind.serie_panel && ind.serie_panel.length > 1) {
    return { serie: ind.serie_panel, fuente: 'panel' };
  }
  if (ind.serie.length > 1) return { serie: ind.serie, fuente: 'serie' };
  return null;
}

/**
 * Cruces publicables (significativos y que se mantienen con controles), en orden de prioridad.
 * `primero` pone una variable al inicio (p. ej. edad en Jóvenes).
 */
export function crucesModal(ind: Indicador, primero?: Cruce['socio']): Cruce[] {
  const xs = getCrucesSignificativos(ind);
  if (!primero) return xs;
  return [...xs.filter((c) => c.socio === primero), ...xs.filter((c) => c.socio !== primero)];
}
