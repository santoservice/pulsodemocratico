/**
 * Configuración del quiz «¿Dónde te ubicas frente al resto del país?» (PLAN.md §5.3).
 *
 * ⚠️ PROVISIONAL: las cifras salen de `docs/datos_test.xlsx` SIN PONDERAR (el cliente decidió
 * usarlas por ahora). Si se cambian por valores ponderados, basta con editar `comparacion.valor`
 * y `distribucion` de cada pregunta: `tests/unit/quiz.test.ts` comprueba que el % / promedio
 * coinciden con la distribución.
 *
 * Preguntas y opciones: documento de especificaciones del cliente, en su orden.
 * Se excluyen 999 (No lo sé) y 998 (Sin respuesta); los % son sobre respuestas válidas.
 *
 * Este archivo se serializa al cliente (isla Quiz): no importar `tablero.json` aquí.
 */
import type { PreguntaQuiz } from '../lib/quiz';

const FUENTE = 'datos_test.xlsx (sin ponderar)';

export const quiz = {
  titulo: '¿Dónde te ubicas frente al resto del país?',
  /** Marca de que las cifras son provisionales (sin ponderar). */
  provisional: true,
  preguntas: [
    {
      // Z6_Desiformacion_2 · Ola 2
      id: 'desinformacion',
      tema: 'desinformacion',
      temaTitulo: 'Desinformación',
      texto: '¿Con qué frecuencia crees que te encuentras con noticias falsas?',
      tipo: 'opciones',
      opciones: [
        { valor: 1, etiqueta: 'Nunca' },
        { valor: 2, etiqueta: 'Casi nunca' },
        { valor: 3, etiqueta: 'Algunas veces' },
        { valor: 4, etiqueta: 'Con frecuencia' },
      ],
      comparacion: {
        modo: 'porcentaje',
        valoresGrupo: [3, 4],
        valor: 79.6978281397545, // 844 / 1.059
        descripcionGrupo: 'dice encontrarse con noticias falsas algunas veces o con frecuencia',
        descripcionFuera: 'dice encontrarse con noticias falsas nunca o casi nunca',
        etiquetaGrupo: 'Algunas veces o con frecuencia',
        etiquetaFuera: 'Nunca o casi nunca',
      },
      grafica: { tipo: 'columnas' },
      curioso: {
        valores: [3, 4],
        prefijo: 'En total,',
        texto: 'dicen toparse con noticias falsas algunas veces o con frecuencia',
      },
      distribucion: [
        { valor: 1, n: 112 },
        { valor: 2, n: 103 },
        { valor: 3, n: 436 },
        { valor: 4, n: 408 },
      ],
      n: 1059,
      ronda: '3.ª ronda',
      fuente: FUENTE,
    },
    {
      // Z4_Pop_5_2 · Ola 2
      id: 'populismo',
      tema: 'populismo',
      temaTitulo: 'Populismo',
      texto: '¿Qué tan de acuerdo estás con la frase «Los políticos hablan mucho y hacen poco»?',
      tipo: 'escala',
      min: 0,
      max: 5,
      etiquetasExtremos: ['Total desacuerdo', 'Total acuerdo'],
      comparacion: { modo: 'promedio', valor: 4.21196130167107 },
      grafica: { tipo: 'barra' },
      curioso: {
        valores: [4, 5],
        texto: 'están de acuerdo o totalmente de acuerdo con la frase (4 o 5)',
      },
      distribucion: [
        { valor: 0, n: 29 },
        { valor: 1, n: 19 },
        { valor: 2, n: 35 },
        { valor: 3, n: 181 },
        { valor: 4, n: 208 },
        { valor: 5, n: 665 },
      ],
      n: 1137,
      ronda: '3.ª ronda',
      fuente: FUENTE,
    },
    {
      // C_ThermGov2Leader_2 + C_ThermOpp2Leader_2 · Ola 2: nota al candidato del "bando
      // contrario" (Cepeda / De la Espriella). 76,8 % le pone 0.
      id: 'polarizacion',
      tema: 'polarizacion',
      temaTitulo: 'Polarización',
      texto:
        '¿Qué tan favorable o desfavorable es tu opinión sobre los líderes políticos del bando contrario al tuyo?',
      tipo: 'escala',
      min: 0,
      max: 10,
      etiquetasExtremos: ['Muy desfavorable', 'Muy favorable'],
      comparacion: { modo: 'promedio', valor: 0.713426853707415 },
      grafica: {
        tipo: 'personas',
        valores: [0],
        si: 'le pusieron 0 a los líderes del bando contrario',
        no: 'le pusieron más de 0',
      },
      curioso: {
        valores: [5, 6, 7, 8, 9, 10],
        prefijo: 'Solo',
        texto: 'les da 5 o más a los líderes del bando contrario',
      },
      distribucion: [
        { valor: 0, n: 766 },
        { valor: 1, n: 56 },
        { valor: 2, n: 54 },
        { valor: 3, n: 37 },
        { valor: 4, n: 30 },
        { valor: 5, n: 31 },
        { valor: 6, n: 10 },
        { valor: 7, n: 11 },
        { valor: 8, n: 2 },
        { valor: 9, n: 1 },
        { valor: 10, n: 0 },
      ],
      n: 998,
      ronda: '3.ª ronda',
      fuente: FUENTE,
    },
    {
      // Z20_IA9_1_5 · Ola 1.5 (solo se preguntó ahí). Promedio 0–5 = 2,61.
      // El documento dice «¿Usa IA para resumir propuestas de candidatos?», pero la escala es de
      // acuerdo (0–5): se plantea como frase, igual que la pregunta de populismo.
      id: 'inteligencia-artificial',
      tema: 'inteligencia-artificial',
      temaTitulo: 'Inteligencia artificial',
      texto:
        '¿Qué tan de acuerdo estás con la frase «Uso la inteligencia artificial (IA) para resumir las propuestas de los candidatos»?',
      tipo: 'escala',
      min: 0,
      max: 5,
      etiquetasExtremos: ['Total desacuerdo', 'Total acuerdo'],
      comparacion: {
        modo: 'porcentaje',
        valoresGrupo: [4, 5],
        valor: 37.4809160305344, // 491 / 1.310
        descripcionGrupo:
          'usa la IA para resumir las propuestas de los candidatos (responde 4 o 5)',
        descripcionFuera: 'no la usa para eso (responde de 0 a 3)',
        etiquetaGrupo: 'La usa para eso (4 o 5)',
        etiquetaFuera: 'No la usa para eso (0 a 3)',
      },
      grafica: { tipo: 'pastel', si: 'usa la IA para resumir propuestas', no: 'no la usa para eso' },
      curioso: {
        valores: [0],
        texto: 'responde 0: está en total desacuerdo, nunca la usa para eso',
      },
      distribucion: [
        { valor: 0, n: 312 },
        { valor: 1, n: 105 },
        { valor: 2, n: 124 },
        { valor: 3, n: 278 },
        { valor: 4, n: 222 },
        { valor: 5, n: 269 },
      ],
      n: 1310,
      ronda: '2.ª ronda',
      fuente: FUENTE,
    },
  ],
} as const satisfies { titulo: string; provisional: boolean; preguntas: readonly PreguntaQuiz[] };

export const preguntasQuiz: readonly PreguntaQuiz[] = quiz.preguntas;
