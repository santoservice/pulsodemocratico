/**
 * "Principales hallazgos" (arriba de /resultados): mosaico con los datos más llamativos de
 * todos los temas. Todo sale de tablero.json por la clave del indicador; para cambiar un
 * dato, su texto o su gráfica basta con editar este archivo.
 *
 * Gráficas:
 * - `linea`: porcentaje ronda a ronda (solo para la tarjeta principal; necesita ≥ 2 rondas).
 * - `escala`: barra con la media dentro de su escala (de esc_lo a esc_hi).
 * - `anillo`: anillo con el porcentaje (proporción del total).
 *
 * La primera tarjeta es la principal (ocupa más espacio en escritorio).
 */
export type GraficaHallazgo = 'linea' | 'escala' | 'anillo';

export interface Hallazgo {
  indicador: string;
  /** Frase bajo la cifra; por defecto, el título del indicador. */
  texto?: string;
  grafica: GraficaHallazgo;
}

export const hallazgos: Hallazgo[] = [
  { indicador: 'desinf_frec', grafica: 'linea' },
  { indicador: 'outdislike', grafica: 'escala' },
  {
    indicador: 'pop_hablan',
    texto: '«Los políticos hablan mucho y hacen poco»',
    grafica: 'anillo',
  },
  { indicador: 'ia2', texto: 'Usa IA generativa (ChatGPT, Gemini…)', grafica: 'anillo' },
  { indicador: 'rs_wa', texto: 'Usa WhatsApp con frecuencia', grafica: 'anillo' },
  { indicador: 'wpip', grafica: 'escala' },
  { indicador: 'pop_expertos', grafica: 'anillo' },
  { indicador: 'fake_media', grafica: 'escala' },
  { indicador: 'ia_conf', grafica: 'escala' },
];
