/**
 * Esquema Zod de `src/data/tablero.json` (objeto `TABLERO` del tablero CNEP).
 *
 * Se valida al importar `src/lib/tablero.ts`: si el JSON cambia de forma, `astro build`
 * y `vitest` fallan con un error que dice qué campo y en qué indicador.
 *
 * Campos opcionales observados en los datos actuales:
 * - `indicador.serie_panel`: solo en 22 de 53 (los que se preguntaron en ≥ 2 rondas a las
 *   mismas personas).
 * - `indicador.polos`: solo en indicadores `media` (23), con las etiquetas de los extremos.
 * - `indicador.es_indice`: solo en los 3 índices nuevos de IA.
 * - `cruce.aj.razon` / `cruce.aj.motivo`: ausentes en algunos cruces.
 * - `indicador.unidad` / `indicador.nota`: pueden ser `null`.
 * - `indicador.serie`: entre 1 y 3 rondas (no siempre las 3).
 */
import { z } from 'astro/zod';

export const TEMA_KEYS = ['polarizacion', 'populismo', 'desinformacion', 'ia', 'consumo'] as const;
export const SOCIO_KEYS = ['edad', 'sexo', 'educ', 'estrato'] as const;
export const OLA_KEYS = ['w1', 'w15', 'w2'] as const;

export const temaKeySchema = z.enum(TEMA_KEYS);
export const socioKeySchema = z.enum(SOCIO_KEYS);
export const olaKeySchema = z.enum(OLA_KEYS);

// En Zod 4, z.number() ya rechaza Infinity/NaN.
const num = z.number();
const int = z.number().int().nonnegative();

export const puntoSerieSchema = z.object({
  ola: olaKeySchema,
  label: z.string().min(1),
  valor: num,
  /** Semiancho del intervalo de confianza (mismas unidades que `valor`). */
  ic: num.nonnegative(),
  n: int,
  n_eff: num.nonnegative(),
});

export const grupoSchema = z.object({
  cat: z.string().min(1),
  code: z.number().int(),
  valor: num,
  ic: num.nonnegative(),
  n: int,
});

export const grupoAjustadoSchema = z.object({
  cat: z.string().min(1),
  code: z.number().int(),
  valor: num,
});

export const ajusteSchema = z.object({
  p: num,
  gl: num,
  efecto: num,
  n: int,
  /** Variables de control del ajuste (socio + 
egion). */
  controles: z.array(z.string()),
  grupos: z.array(grupoAjustadoSchema),
  brecha: num,
  razon: num.optional(),
  motivo: z.enum(['imprecisa', 'atenuada']).optional(),
  q: num,
  brecha_rel: num,
  significativo: z.boolean(),
});

export const ajusteIdeologiaSchema = z.object({
  p: num,
  efecto: num,
  n: int,
  q: num,
  significativo: z.boolean(),
});

export const cruceSchema = z.object({
  socio: socioKeySchema,
  socio_label: z.string().min(1),
  prioridad: z.number().int(),
  grupos: z.array(grupoSchema).min(1),
  /** Categorías no mostradas por tener n < `meta.n_min_celda`. */
  suprimidos: z.array(z.string()),
  /** Diferencia entre el grupo más alto y el más bajo. */
  brecha: num,
  n: int,
  prueba: z.enum(['chi2', 'F']),
  estad: num,
  gl: num,
  p: num,
  efecto: num,
  efecto_tipo: z.enum(['V', 'eta2']),
  /** Prueba repetida con controles sociodemográficos. */
  aj: ajusteSchema,
  /** Prueba repetida controlando además por ideología (informativa). */
  aj_ideol: ajusteIdeologiaSchema,
  q: num,
  brecha_rel: num,
  significativo: z.boolean(),
});

export const indicadorSchema = z
  .object({
    key: z.string().min(1),
    tema: temaKeySchema,
    titulo: z.string().min(1),
    pregunta: z.string().min(1),
    stat: z.enum(['pct', 'media']),
    unidad: z.string().nullable(),
    /** Cómo se lee un valor alto. */
    alto: z.string(),
    nota: z.string().nullable(),
    destacado: z.boolean(),
    esc_lo: num,
    esc_hi: num,
    familia: z.string().min(1),
    rep_familia: z.boolean(),
    serie: z.array(puntoSerieSchema).min(1),
    serie_panel: z.array(puntoSerieSchema).min(1).optional(),
    cruces: z.partialRecord(socioKeySchema, cruceSchema),
    ola_cruce: olaKeySchema,
    ola_cruce_label: z.string(),
    polos: z.tuple([z.string(), z.string()]).optional(),
    es_indice: z.boolean().optional(),
  })
  .refine((i) => i.esc_hi > i.esc_lo, {
    message: 'esc_hi debe ser mayor que esc_lo',
    path: ['esc_hi'],
  });

const disenoSchema = z.object({ n: int, deff: num, n_eff: num });

export const metaSchema = z.object({
  titulo: z.string(),
  n_total: int,
  n_olas: z.record(olaKeySchema, int),
  olas: z.record(olaKeySchema, z.string()),
  olas_tecnico: z.record(z.string(), z.string()),
  diseno: z.record(z.string(), disenoSchema),
  no_probabilistico: z.boolean(),
  alfa: num,
  brecha_min: num,
  n_min_celda: int,
  n_pruebas: int,
  n_significativos: int,
  n_publicables: int,
  n_descartados_control: int,
  controles: z.partialRecord(socioKeySchema, z.array(z.string())),
  alfas_indices_nuevos: z.record(z.string(), num),
});

export const temaSchema = z.object({
  key: temaKeySchema,
  titulo: z.string().min(1),
  bajada: z.string(),
});

export const socioSchema = z.object({
  label: z.string().min(1),
  prioridad: z.number().int(),
  cats: z.array(z.string()).min(1),
});

export const tableroSchema = z
  .object({
    meta: metaSchema,
    temas: z.array(temaSchema).min(1),
    socio: z.record(socioKeySchema, socioSchema),
    indicadores: z.array(indicadorSchema).min(1),
  })
  .superRefine((t, ctx) => {
    const keys = new Set<string>();
    const temas = new Set(t.temas.map((x) => x.key));
    t.indicadores.forEach((ind, idx) => {
      if (keys.has(ind.key)) {
        ctx.addIssue({
          code: 'custom',
          message: `Indicador duplicado: ${ind.key}`,
          path: ['indicadores', idx, 'key'],
        });
      }
      keys.add(ind.key);
      if (!temas.has(ind.tema)) {
        ctx.addIssue({
          code: 'custom',
          message: `El indicador ${ind.key} apunta a un tema inexistente: ${ind.tema}`,
          path: ['indicadores', idx, 'tema'],
        });
      }
    });
  });

export type TemaKey = z.infer<typeof temaKeySchema>;
export type SocioKey = z.infer<typeof socioKeySchema>;
export type OlaKey = z.infer<typeof olaKeySchema>;
export type PuntoSerie = z.infer<typeof puntoSerieSchema>;
export type Grupo = z.infer<typeof grupoSchema>;
export type GrupoAjustado = z.infer<typeof grupoAjustadoSchema>;
export type Ajuste = z.infer<typeof ajusteSchema>;
export type Cruce = z.infer<typeof cruceSchema>;
export type Indicador = z.infer<typeof indicadorSchema>;
export type Meta = z.infer<typeof metaSchema>;
export type TemaData = z.infer<typeof temaSchema>;
export type Socio = z.infer<typeof socioSchema>;
export type Tablero = z.infer<typeof tableroSchema>;

/** Valida el JSON y lanza un error legible (ruta + mensaje por problema) si no cumple. */
export function parseTablero(data: unknown): Tablero {
  const r = tableroSchema.safeParse(data);
  if (r.success) return r.data;
  const detalle = r.error.issues
    .slice(0, 20)
    .map((i) => `  · ${i.path.join('.') || '(raíz)'}: ${i.message}`)
    .join('\n');
  throw new Error(
    `src/data/tablero.json no cumple el esquema (${r.error.issues.length} problema(s)):\n${detalle}`,
  );
}
